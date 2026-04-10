-- ================================================================
-- Seed — Dados de teste para desenvolvimento local
-- ================================================================

-- Pratos do menu (datas relativas a hoje para ficarem sempre visíveis)
INSERT INTO menu_items (id, name, description, price, meal_date, active) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Frango Assado com Arroz',
   'Frango assado no forno com arroz de cenoura e salada de alface',
   8.50,
   CURRENT_DATE + INTERVAL '2 days',
   true),

  ('00000000-0000-0000-0000-000000000002',
   'Bacalhau à Brás',
   'Bacalhau desfiado com ovos, batata palha e azeitonas',
   10.00,
   CURRENT_DATE + INTERVAL '2 days',
   true),

  ('00000000-0000-0000-0000-000000000003',
   'Cozido à Portuguesa',
   'Cozido com grão, couve, cenoura, batata e enchidos variados',
   11.50,
   CURRENT_DATE + INTERVAL '9 days',
   true),

  ('00000000-0000-0000-0000-000000000004',
   'Arroz de Pato',
   'Arroz de pato gratinado com chouriço e laranja',
   9.50,
   CURRENT_DATE + INTERVAL '9 days',
   true);

-- Reservas de exemplo
INSERT INTO reservations (menu_item_id, customer_name, customer_phone, quantity, total_amount, paid, paid_at) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Maria Silva',
   '+351912345678',
   2,
   17.00,
   true,
   NOW() - INTERVAL '1 day'),

  ('00000000-0000-0000-0000-000000000002',
   'João Santos',
   '+351961234567',
   1,
   10.00,
   false,
   NULL),

  ('00000000-0000-0000-0000-000000000003',
   'Ana Ferreira',
   '+351931234567',
   3,
   34.50,
   true,
   NOW() - INTERVAL '2 hours');

-- Atualizar config com valor manual angariado (simula donativos em dinheiro)
UPDATE fundraising_config SET
  goal = 5000.00,
  label = 'Obras do Templo',
  manual_raised = 150.00
WHERE id = 1;
