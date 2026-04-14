CREATE POLICY "Deny public insert on menu_items"
  ON menu_items FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public update on menu_items"
  ON menu_items FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete on menu_items"
  ON menu_items FOR DELETE
  USING (false);

CREATE POLICY "Deny public access to reservations"
  ON reservations FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny public access to fundraising_config"
  ON fundraising_config FOR ALL
  USING (false)
  WITH CHECK (false);
