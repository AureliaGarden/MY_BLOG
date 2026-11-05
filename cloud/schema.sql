-- Apply once to a new database. The version pointer changes atomically with
-- its chunks so readers never observe a partially written document.
CREATE TABLE IF NOT EXISTS blog_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS blog_chunks (
  revision TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  content TEXT NOT NULL,
  PRIMARY KEY (revision, ordinal)
);
