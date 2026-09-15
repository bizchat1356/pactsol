INSERT OR IGNORE INTO catalog_categories (name, sort_order, active) VALUES
  ('Packaging & Dispatch Consumables', 1, 1),
  ('Industrial Adhesives, Sealants & Surface Protection', 2, 1),
  ('Safety & PPE', 3, 1),
  ('Material Handling & Warehouse MRO', 4, 1),
  ('General Industrial Replacement MRO', 5, 1),
  ('Low-risk Solar O&M Accessories', 6, 1);

INSERT OR IGNORE INTO catalog_products (category_id, name, sort_order, active) VALUES
  (
    (SELECT id FROM catalog_categories WHERE name = 'Packaging & Dispatch Consumables'),
    'Stretch film', 1, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Packaging & Dispatch Consumables'),
    'BOPP and packaging tapes', 2, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Packaging & Dispatch Consumables'),
    'Strapping materials', 3, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Packaging & Dispatch Consumables'),
    'Bubble and protective packaging', 4, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Industrial Adhesives, Sealants & Surface Protection'),
    'Industrial adhesives and bonding compounds', 1, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Industrial Adhesives, Sealants & Surface Protection'),
    'Silicone, PU, epoxy, and acrylic sealants', 2, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Industrial Adhesives, Sealants & Surface Protection'),
    'Threadlockers, retaining compounds, and gasket makers', 3, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Industrial Adhesives, Sealants & Surface Protection'),
    'Anti-corrosion coatings and rust removers', 4, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Industrial Adhesives, Sealants & Surface Protection'),
    'Surface-preparation and repair compounds', 5, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Safety & PPE'),
    'Safety footwear', 1, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Safety & PPE'),
    'Protective gloves', 2, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Safety & PPE'),
    'Safety helmets', 3, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Safety & PPE'),
    'Selected protective equipment', 4, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Material Handling & Warehouse MRO'),
    'Conveyor rollers and idlers', 1, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Material Handling & Warehouse MRO'),
    'Pallet-truck load wheels and steering wheels', 2, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Material Handling & Warehouse MRO'),
    'Industrial castors and heavy-duty wheels', 3, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Material Handling & Warehouse MRO'),
    'Conveyor chains and sprockets', 4, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Material Handling & Warehouse MRO'),
    'Selected conveyor replacement components', 5, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'General Industrial Replacement MRO'),
    'Ordinary mechanical seals', 1, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'General Industrial Replacement MRO'),
    'Industrial hose assemblies', 2, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'General Industrial Replacement MRO'),
    'Selected pump replacement parts', 3, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'General Industrial Replacement MRO'),
    'Non-specialised gasket and sealing components', 4, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Low-risk Solar O&M Accessories'),
    'Module-cleaning replacement components', 1, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Low-risk Solar O&M Accessories'),
    'Selected mounting clamps and fasteners', 2, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Low-risk Solar O&M Accessories'),
    'Non-electrical cable-management hardware', 3, 1
  ),
  (
    (SELECT id FROM catalog_categories WHERE name = 'Low-risk Solar O&M Accessories'),
    'Selected mechanical O&M accessories', 4, 1
  );