const MAX_REQUEST_BYTES = 256 * 1024;

export default {
  async fetch(request, env) {
    if (request.method === 'GET') {
      return textResponse('PACTSOL Tally webhook endpoint', 200);
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: {
          Allow: 'GET, POST',
          'Cache-Control': 'no-store',
        },
      });
    }

    try {
      if (
        !env.RESEND_API_KEY ||
        !env.TALLY_SIGNING_SECRET ||
        !env.TALLY_SUPPLIER_SIGNING_SECRET
      ) {
        console.error('Webhook configuration is incomplete.');

        return textResponse(
          'Webhook configuration error',
          500
        );
      }

      const rawBody = await readRequestBodyWithLimit(
        request,
        MAX_REQUEST_BYTES
      );

      if (!rawBody) {
        return textResponse(
          'Missing request body',
          400
        );
      }

      const receivedSignature =
        request.headers.get('Tally-Signature');

      if (!receivedSignature) {
        return textResponse(
          'Missing Tally signature',
          401
        );
      }

      const verifiedFormType =
        await verifyAgainstPACTSOLSecrets(
          rawBody,
          receivedSignature,
          env
        );

      if (!verifiedFormType) {
        return textResponse(
          'Invalid Tally signature',
          401
        );
      }

      const payload = JSON.parse(rawBody);
  
      /*
      console.log(
      JSON.stringify({
    eventType: payload.eventType,
    formName: submission.formName,
    pactsolReference,
    tallySubmissionReference,
    fieldsCount: fields.length
  })
);
*/

      if (payload.eventType !== 'FORM_RESPONSE') {
        return textResponse(
          'Event ignored',
          200
        );
      }

      const submission =
        payload.data ?? {};

      const fields =
        Array.isArray(submission.fields)
          ? submission.fields
          : [];

      const companyName =
  getFieldValue(
    fields,
    'Company / Organization Name'
  ) ||
  'UNKNOWN';
          
      
      console.log(
  JSON.stringify({
    eventType: payload.eventType,
    formName: submission.formName,
    fieldsType: typeof submission.fields,
    fieldsIsArray: Array.isArray(submission.fields),
    fieldsCount: fields.length,
    fieldLabels: fields.map(
      (field) => field.label
    ),
  })
);
          

      const formName =
        typeof submission.formName === 'string'
          ? submission.formName.trim()
          : '';

      const payloadFormType =
        classifyFormType(formName);

      if (!payloadFormType) {
        console.error(
          'Unrecognized Tally form name.'
        );

        return textResponse(
          'Unrecognized form',
          400
        );
      }

      if (
        payloadFormType !==
        verifiedFormType
      ) {
        console.error(
          'Tally signing secret does not match form type.'
        );

        return textResponse(
          'Form authentication mismatch',
          401
        );
      }

      const submitterEmail =
        getSubmitterEmail(fields);

      const tallySubmissionReference =
        submission.submissionId ||
        submission.responseId ||
        null;

      const storedRequirement =
        payloadFormType === 'buyer'
          ? await persistBuyerRequirement(
              env.PACTSOL_DB,
              fields,
              tallySubmissionReference
            )
          : null;

      const storedSupplier =
        payloadFormType === 'supplier'
          ? await persistSupplierProfile(
              env.PACTSOL_DB,
              fields,
              tallySubmissionReference
            )
          : null;

      const pactsolReference =
        storedRequirement?.requirementCode ||
        storedSupplier?.supplierReference ||
        createPACTSOLReference(companyName);

const submittedAt =
  submission.createdAt ||
  payload.createdAt ||
  new Date().toISOString();

      const formattedAnswers = fields
        .filter(shouldIncludeField)
        .map((field) => ({
          label:
            field.label || 'Field',

          value:
            formatFieldValue(field),
        }));

      const answersHtml =
        formattedAnswers
          .map(
            ({ label, value }) => `
              <tr>
                <td
                  style="
                    padding:8px 12px;
                    border-bottom:1px solid #e5e7eb;
                    font-weight:600;
                    vertical-align:top;
                    width:38%;
                  "
                >
                  ${escapeHtml(label)}
                </td>

                <td
                  style="
                    padding:8px 12px;
                    border-bottom:1px solid #e5e7eb;
                    vertical-align:top;
                  "
                >
                  ${escapeHtml(value)}
                </td>
              </tr>
            `
          )
          .join('');

      const isSupplierForm =
        payloadFormType ===
        'supplier';

      const acknowledgmentTitle =
        isSupplierForm
          ? 'Supplier information received'
          : 'Sourcing enquiry received';

      const internalTitle =
        isSupplierForm
          ? 'New Supplier Registration'
          : 'New Procurement Enquiry';

      let emailPayload;

      if (submitterEmail) {
        emailPayload = {
          from:
            'PACTSOL <notifications@pactsol.in>',

          to: [
            submitterEmail,
          ],

          bcc: [
            'pactsol@outlook.com',
          ],

          reply_to:
            'hello@pactsol.in',

          subject:
  `PACTSOL — ${acknowledgmentTitle} — ${pactsolReference}`,

          html: `
            <div
              style="
                font-family:Arial,Helvetica,sans-serif;
                max-width:720px;
                margin:0 auto;
                color:#1f2937;
                line-height:1.6;
              "
            >
              <h2
                style="
                  color:#0B3558;
                  margin-bottom:12px;
                "
              >
                Thank you for contacting PACTSOL.
              </h2>

              ${
                isSupplierForm
                  ? `
                    <p>
                      We have received your supplier information
                      and will review it for potential relevance
                      to suitable sourcing requirements.
                    </p>

                    <p>
                      This acknowledgment confirms receipt only.
                      Submission of supplier information does not
                      constitute supplier approval, appointment,
                      preferred-supplier status, an enquiry
                      opportunity, an order, or a guarantee of
                      future business.
                    </p>
                  `
                  : `
                    <p>
                      We have received your sourcing enquiry and
                      will review the information provided.
                      PACTSOL may contact you if clarification or
                      additional information is required.
                    </p>

                    <p>
                      This acknowledgment confirms receipt only.
                      It does not represent acceptance of a
                      sourcing requirement, quotation, order,
                      commercial commitment, guarantee of
                      availability, or guarantee of transaction
                      completion.
                    </p>
                  `
              }

              <p>
  <p>
<strong>PACTSOL Reference:</strong>
${escapeHtml(pactsolReference)}

<p>
  <strong>Tally Submission Reference:</strong>
  ${escapeHtml(tallySubmissionReference || 'Not available')}
</p>
</p>

<p>
<strong>Submitted At:</strong>
${escapeHtml(submittedAt)}
</p>
</p>

<hr
  style="
    border:0;
    border-top:1px solid #d8dccf;
    margin:24px 0;
  "
/>

<h3 style="color:#0B3558;">
  Information submitted
</h3>

<p>
  The following is a copy of the information received
  through your submission. This copy is provided for
  reference and does not constitute acceptance,
  verification, quotation, order confirmation, or any
  commercial commitment by PACTSOL.
</p>

<table
  style="
    width:100%;
    border-collapse:collapse;
    font-size:14px;
  "
>
  ${answersHtml}
</table>

<p style="margin-top:24px;">
  Regards,<br />
                <strong>PACTSOL</strong><br />
                Managed B2B Sourcing
              </p>
            </div>
          `,
        };
      } else {
        emailPayload = {
          from:
            'PACTSOL <notifications@pactsol.in>',

          to: [
            'pactsol@outlook.com',
          ],

          reply_to:
            'hello@pactsol.in',

subject:
  `PACTSOL — ${internalTitle} — ${pactsolReference}`,

          html: `
            <div
              style="
                font-family:Arial,Helvetica,sans-serif;
                max-width:720px;
                margin:0 auto;
                color:#1f2937;
                line-height:1.6;
              "
            >
              <h2 style="color:#0B3558;">
                ${escapeHtml(internalTitle)}
              </h2>

              <p>
                A new submission has been received through
                <strong>${escapeHtml(formName)}</strong>.
              </p>

              <p>
                No usable submitter email address was provided,
                so no email acknowledgment was sent to the
                submitter.
              </p>

              <p>
  <strong>PACTSOL Reference:</strong>
  ${escapeHtml(pactsolReference)}
</p>

<p>
  <strong>Tally Submission Reference:</strong>
  ${escapeHtml(tallySubmissionReference || 'Not available')}
</p>

<p>
  <strong>Submitted At:</strong>
  ${escapeHtml(submittedAt)}
</p>

              <hr
                style="
                  border:0;
                  border-top:1px solid #d8dccf;
                  margin:24px 0;
                "
              />

              <table
                style="
                  width:100%;
                  border-collapse:collapse;
                  font-size:14px;
                "
              >
                ${answersHtml}
              </table>
            </div>
          `,
        };
      }

      const idempotencyReference =
  payload.eventId ||
  `${payloadFormType}-${pactsolReference}-${tallySubmissionReference}`;

      const idempotencyKey =
        await createIdempotencyKey(
          idempotencyReference
        );

      const resendResponse =
        await fetch(
          'https://api.resend.com/emails',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${env.RESEND_API_KEY}`,

              'Content-Type':
                'application/json',

              'Idempotency-Key':
                `tally/${idempotencyKey}`,
            },

            body:
              JSON.stringify(
                emailPayload
              ),
          }
        );

      if (!resendResponse.ok) {
        if (storedRequirement) {
          await recordNotification(
            env.PACTSOL_DB,
            storedRequirement.id,
            'tally_acknowledgement',
            'failed'
          );
        }

        console.error(
          'Resend API request failed:',
          resendResponse.status,
          resendResponse.headers.get(
            'x-request-id'
          ) || 'no-request-id'
        );

        return textResponse(
          'Email delivery failed',
          502
        );
      }

      if (storedRequirement) {
        await recordNotification(
          env.PACTSOL_DB,
          storedRequirement.id,
          'tally_acknowledgement',
          'sent'
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          formType:
            payloadFormType,
          pactsolReference,
          tallySubmissionReference,
          acknowledgmentSent:
            Boolean(
              submitterEmail
            ),
        }),
        {
          status: 200,

          headers: {
            'Content-Type':
              'application/json; charset=utf-8',

            'Cache-Control':
              'no-store',
          },
        }
      );
    } catch (error) {
      if (
        error instanceof
        PayloadTooLargeError
      ) {
        return textResponse(
          'Request body too large',
          413
        );
      }

      if (
        error instanceof
        SyntaxError
      ) {
        return textResponse(
          'Invalid JSON payload',
          400
        );
      }

      console.error(
        'Webhook processing error:',
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );

      return textResponse(
        'Webhook processing failed',
        500
      );
    }
  },
};


async function persistBuyerRequirement(
  db,
  fields,
  tallySubmissionReference
) {
  if (!db) {
    throw new Error('PACTSOL_DB binding is not configured.');
  }

  if (tallySubmissionReference) {
    const existing = await db
      .prepare(
        `SELECT id, requirement_code
         FROM requirements
         WHERE intake_channel = 'web'
           AND source_reference = ?`
      )
      .bind(tallySubmissionReference)
      .first();

    if (existing) {
      return {
        id: existing.id,
        requirementCode: existing.requirement_code,
      };
    }
  }

  const companyName =
    getFieldValue(fields, 'Company / Organization Name') ||
    'Unknown organization';
  const contactName =
    getFieldValue(fields, 'Contact Person Name');
  const email = getFieldValue(fields, 'Email');
  const phone = normalizeIndianPhone(
    getFieldValue(fields, 'Mobile Number')
  );
  const sourcingCategory =
    getFieldValue(fields, 'Sourcing Category');
  const selectedProductFamily =
    getFieldValue(fields, 'Selected Product Family');
  const productDescription =
    getFieldValue(fields, 'Product / Material Required') ||
    [sourcingCategory, selectedProductFamily]
      .filter(Boolean)
      .join(' — ') ||
    'Product details not provided';
  const quantity = parseQuantity(
    getFieldValue(fields, 'Quantity Required')
  );

  let organization = await db
    .prepare(
      `SELECT id FROM organizations
       WHERE name = ? COLLATE NOCASE`
    )
    .bind(companyName)
    .first();

  const organizationId =
    organization?.id || crypto.randomUUID();

  if (!organization) {
    await db
      .prepare(
        `INSERT INTO organizations (id, name)
         VALUES (?, ?)`
      )
      .bind(organizationId, companyName)
      .run();
  }

  let contact = await db
    .prepare(
      `SELECT id FROM contacts
       WHERE email = ? OR phone_e164 = ?`
    )
    .bind(email, phone)
    .first();

  const contactId = contact?.id || crypto.randomUUID();

  if (!contact) {
    await db
      .prepare(
        `INSERT INTO contacts
          (id, organization_id, full_name, email, phone_e164)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        contactId,
        organizationId,
        contactName,
        email,
        phone
      )
      .run();
  }

  const counter = await db
    .prepare(
      `UPDATE requirement_counters
       SET last_value = last_value + 1
       WHERE intake_channel = 'web'
       RETURNING last_value`
    )
    .first();

  if (!counter) {
    throw new Error('Web requirement counter is unavailable.');
  }

  const requirementId = crypto.randomUUID();
  const requirementCode = createRequirementCode(
    'WB',
    counter.last_value
  );

  await db.batch([
    db
      .prepare(
        `INSERT INTO requirements (
           id, requirement_code, intake_channel, source_reference,
           organization_id, contact_id, specification,
           delivery_location, required_by
         ) VALUES (?, ?, 'web', ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        requirementId,
        requirementCode,
        tallySubmissionReference,
        organizationId,
        contactId,
        getFieldValue(fields, 'Additional Information'),
        getFieldValue(fields, 'Delivery Location'),
        getFieldValue(fields, 'Required Delivery Date')
      ),
    db
      .prepare(
        `INSERT INTO requirement_items (
           requirement_id, product_description, quantity, uom
         ) VALUES (?, ?, ?, ?)`
      )
      .bind(
        requirementId,
        productDescription,
        quantity.value,
        quantity.unit
      ),
    db
      .prepare(
        `INSERT INTO requirement_status_history (
           requirement_id, status, note
         ) VALUES (?, 'received', ?)`
      )
      .bind(
        requirementId,
        'Received through the PACTSOL web enquiry form.'
      ),
  ]);

  return { id: requirementId, requirementCode };
}


async function persistSupplierProfile(
  db,
  fields,
  tallySubmissionReference
) {
  if (!db) {
    throw new Error('PACTSOL_DB binding is not configured.');
  }

  const sourceReference =
    tallySubmissionReference ||
    `unreferenced-${crypto.randomUUID()}`;

  const existing = await db
    .prepare(
      `SELECT id, supplier_reference
       FROM supplier_profiles
       WHERE source_reference = ?`
    )
    .bind(sourceReference)
    .first();

  if (existing) {
    return {
      id: existing.id,
      supplierReference: existing.supplier_reference,
    };
  }

  const supplierId = crypto.randomUUID();
  const companyName =
    getFieldValue(fields, 'Company / Organization Name') ||
    'Unknown supplier';
  const supplierReference =
    `SUP_PACT_${supplierId.replace(/-/g, '').slice(0, 12).toUpperCase()}`;

  await db
    .prepare(
      `INSERT INTO supplier_profiles (
         id, source_reference, supplier_reference, company_name,
         contact_name, email, phone_e164, product_description,
         supply_capacity, lead_time, supply_location, notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      supplierId,
      sourceReference,
      supplierReference,
      companyName,
      getFieldValue(fields, 'Contact Person Name'),
      getFieldValue(fields, 'Email'),
      normalizeIndianPhone(
        getFieldValue(fields, 'Mobile Number')
      ),
      getFieldValue(fields, 'Product / Material Supplied'),
      getFieldValue(fields, 'Supply Capacity'),
      getFieldValue(fields, 'Lead Time / Availability'),
      getFieldValue(fields, 'Supply Location'),
      getFieldValue(fields, 'Additional Information')
    )
    .run();

  return { id: supplierId, supplierReference };
}


async function recordNotification(
  db,
  requirementId,
  eventType,
  status
) {
  await db
    .prepare(
      `INSERT INTO notification_log (
         requirement_id, channel, event_type, status, sent_at
       ) VALUES (?, 'email', ?, ?,
         CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE NULL END)`
    )
    .bind(requirementId, eventType, status, status)
    .run();
}


function normalizeIndianPhone(value) {
  if (!value) {
    return null;
  }

  const digits = String(value).replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return digits.length >= 11 ? `+${digits}` : null;
}


function parseQuantity(value) {
  const rawValue = String(value || '').trim();
  const match = rawValue.match(
    /^(\d+(?:\.\d+)?)\s*(.*)$/
  );

  if (!match) {
    return { value: null, unit: rawValue || null };
  }

  return {
    value: Number(match[1]),
    unit: match[2].trim() || null,
  };
}


class PayloadTooLargeError
  extends Error {
  constructor() {
    super(
      'Request body too large'
    );

    this.name =
      'PayloadTooLargeError';
  }
}


function textResponse(
  message,
  status
) {
  return new Response(
    message,
    {
      status,

      headers: {
        'Content-Type':
          'text/plain; charset=utf-8',

        'Cache-Control':
          'no-store',
      },
    }
  );
}


async function readRequestBodyWithLimit(
  request,
  maxBytes
) {
  const contentLength =
    request.headers.get(
      'Content-Length'
    );

  if (contentLength) {
    const parsedLength =
      Number(contentLength);

    if (
      Number.isFinite(
        parsedLength
      ) &&
      parsedLength >
        maxBytes
    ) {
      throw new PayloadTooLargeError();
    }
  }

  if (!request.body) {
    return '';
  }

  const reader =
    request.body.getReader();

  const chunks = [];

  let totalBytes = 0;

  try {
    while (true) {
      const {
        done,
        value,
      } =
        await reader.read();

      if (done) {
        break;
      }

      totalBytes +=
        value.byteLength;

      if (
        totalBytes >
        maxBytes
      ) {
        await reader.cancel();

        throw new PayloadTooLargeError();
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined =
    new Uint8Array(
      totalBytes
    );

  let offset = 0;

  for (
    const chunk
    of chunks
  ) {
    combined.set(
      chunk,
      offset
    );

    offset +=
      chunk.byteLength;
  }

  return new TextDecoder()
    .decode(combined);
}


async function verifyAgainstPACTSOLSecrets(
  rawBody,
  receivedSignature,
  env
) {
  const candidates = [
    {
      formType:
        'buyer',

      signingSecret:
        env.TALLY_SIGNING_SECRET,
    },

    {
      formType:
        'supplier',

      signingSecret:
        env.TALLY_SUPPLIER_SIGNING_SECRET,
    },
  ];

  for (
    const candidate
    of candidates
  ) {
    if (
      !candidate.signingSecret
    ) {
      continue;
    }

    const valid =
      await verifyTallySignature(
        rawBody,
        receivedSignature,
        candidate.signingSecret
      );

    if (valid) {
      return candidate.formType;
    }
  }

  return null;
}


function classifyFormType(
  formName
) {
  if (!formName) {
    return null;
  }

  const normalizedName =
    formName.toLowerCase();

  if (
    normalizedName
      .includes(
        'supplier'
      )
  ) {
    return 'supplier';
  }

  if (
    normalizedName
      .includes(
        'procurement'
      ) ||
    normalizedName
      .includes(
        'sourcing'
      ) ||
    normalizedName
      .includes(
        'buyer'
      )
  ) {
    return 'buyer';
  }

  return null;
}


async function verifyTallySignature(
  rawBody,
  receivedSignature,
  signingSecret
) {
  const encoder =
    new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      'raw',

      encoder.encode(
        signingSecret
      ),

      {
        name: 'HMAC',
        hash: 'SHA-256',
      },

      false,

      [
        'sign',
      ]
    );

  const signatureBuffer =
    await crypto.subtle.sign(
      'HMAC',

      key,

      encoder.encode(
        rawBody
      )
    );

  const calculatedSignature =
    arrayBufferToBase64(
      signatureBuffer
    );

  return timingSafeEqual(
    receivedSignature,
    calculatedSignature
  );
}


function getSubmitterEmail(
  fields
) {
  const emailField =
    fields.find(
      (field) =>
        field &&
        field.type ===
          'INPUT_EMAIL' &&
        typeof field.value ===
          'string' &&
        field.value.trim() !==
          ''
    );

  if (!emailField) {
    return null;
  }

  const email =
    emailField.value.trim();

  return isValidEmail(
    email
  )
    ? email
    : null;
}


function isValidEmail(
  value
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}


function shouldIncludeField(
  field
) {
  if (
    !field ||
    !field.label
  ) {
    return false;
  }

  return !(
    field.value === null ||
    field.value === undefined ||
    field.value === ''
  );
}


function formatFieldValue(
  field
) {
  const value =
    field.value;

  if (Array.isArray(value)) {
    if (
      Array.isArray(
        field.options
      )
    ) {
      const optionMap =
        new Map(
          field.options.map(
            (option) => [
              option.id,
              option.text,
            ]
          )
        );

      return value
        .map((item) => {
          if (
            typeof item ===
            'string'
          ) {
            return (
              optionMap.get(
                item
              ) ||
              item
            );
          }

          if (
            item &&
            typeof item ===
              'object'
          ) {
            return (
              item.name ||
              item.url ||
              JSON.stringify(
                item
              )
            );
          }

          return String(
            item
          );
        })
        .join(', ');
    }

    return value
      .map((item) => {
        if (
          item &&
          typeof item ===
            'object'
        ) {
          return (
            item.name ||
            item.url ||
            JSON.stringify(
              item
            )
          );
        }

        return String(
          item
        );
      })
      .join(', ');
  }

  if (
    value &&
    typeof value ===
      'object'
  ) {
    return JSON.stringify(
      value
    );
  }

  return String(
    value
  );
}


function escapeHtml(
  value
) {
  return String(value)
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
}


async function createIdempotencyKey(
  value
) {
  const bytes =
    new TextEncoder()
      .encode(
        String(value)
      );

  const digest =
    await crypto.subtle.digest(
      'SHA-256',
      bytes
    );

  return Array
    .from(
      new Uint8Array(
        digest
      )
    )
    .map(
      (byte) =>
        byte
          .toString(16)
          .padStart(
            2,
            '0'
          )
    )
    .join('');
}


function arrayBufferToBase64(
  buffer
) {
  const bytes =
    new Uint8Array(
      buffer
    );

  let binary = '';

  for (
    const byte
    of bytes
  ) {
    binary +=
      String.fromCharCode(
        byte
      );
  }

  return btoa(
    binary
  );
}

function getFieldValue(fields, label) {
  const field = fields.find(
    (item) =>
      item &&
      item.label === label
  );

  return field?.value
    ? String(field.value).trim()
    : null;
}


function createPACTSOLReference(companyName) {
  const now = new Date();

  const timestamp =
    now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '-');

  const safeCompany =
    String(companyName)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40);

  return `PACTSOL-${safeCompany || 'UNKNOWN'}-${timestamp}`;
}


function timingSafeEqual(
  a,
  b
) {
  if (
    typeof a !==
      'string' ||
    typeof b !==
      'string'
  ) {
    return false;
  }

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  let result = 0;

  for (
    let index = 0;
    index < a.length;
    index++
  ) {
    result |=
      a.charCodeAt(
        index
      ) ^
      b.charCodeAt(
        index
      );
  }

  return result === 0;
}


function createRequirementCode(
  channelCode,
  sequence,
  createdAt = new Date()
) {
  const dateParts = new Intl.DateTimeFormat(
    'en-GB',
    {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }
  )
    .formatToParts(createdAt)
    .reduce(
      (parts, part) => {
        if (part.type !== 'literal') {
          parts[part.type] = part.value;
        }

        return parts;
      },
      {}
    );

  const timestamp = [
    dateParts.day,
    dateParts.month.toUpperCase().slice(0, 3),
    dateParts.year,
    `${dateParts.hour}_${dateParts.minute}_${dateParts.second}`,
  ].join('-');

  return `REQ_PACT_${channelCode}_${String(sequence).padStart(3, '0')}_${timestamp}`;
}
