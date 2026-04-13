-- ================================================================
-- Seed — Dados de teste para desenvolvimento local
-- ================================================================

-- Pratos do menu — Refeições (category = 'meals')
INSERT INTO menu_items (id, name, description, price, meal_date, active, category) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'Frango Assado com Arroz',
   'Frango assado no forno com arroz de cenoura e salada de alface',
   8.50,
   CURRENT_DATE + INTERVAL '2 days',
   true,
   'meals'),

  ('00000000-0000-0000-0000-000000000002',
   'Bacalhau à Brás',
   'Bacalhau desfiado com ovos, batata palha e azeitonas',
   10.00,
   CURRENT_DATE + INTERVAL '2 days',
   true,
   'meals'),

  ('00000000-0000-0000-0000-000000000003',
   'Cozido à Portuguesa',
   'Cozido com grão, couve, cenoura, batata e enchidos variados',
   11.50,
   CURRENT_DATE + INTERVAL '9 days',
   true,
   'meals'),

  ('00000000-0000-0000-0000-000000000004',
   'Arroz de Pato',
   'Arroz de pato gratinado com chouriço e laranja',
   9.50,
   CURRENT_DATE + INTERVAL '9 days',
   true,
   'meals');

-- Pratos do menu — Café da Manhã (category = 'breakfast')
INSERT INTO menu_items (id, name, description, price, meal_date, active, category) VALUES
  ('00000000-0000-0000-0000-000000000005',
   'Pequeno-Almoço Completo',
   'Pão, manteiga, queijo, fiambre, sumo natural e café ou chá',
   4.50,
   CURRENT_DATE + INTERVAL '2 days',
   true,
   'breakfast'),

  ('00000000-0000-0000-0000-000000000006',
   'Tosta Mista com Café',
   'Tosta de pão de forma com queijo e fiambre, café ou meia de leite',
   3.50,
   CURRENT_DATE + INTERVAL '9 days',
   true,
   'breakfast');

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

-- Atualizar config das refeições com valor manual angariado
UPDATE fundraising_config SET
  goal = 5000.00,
  label = 'Obras do Templo',
  manual_raised = 150.00
WHERE id = 1;

-- Atualizar config do café da manhã (já inserida pela migration)
UPDATE fundraising_config SET
  goal = 1000.00,
  label = 'Café da Manhã Solidário',
  manual_raised = 0.00
WHERE id = 2;
