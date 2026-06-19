-- Backfill default chapter titles for rows created before titles were persisted on create.
UPDATE chapters
SET title = 'Chapter ' || (sort_order + 1)::text
WHERE title IS NULL;
