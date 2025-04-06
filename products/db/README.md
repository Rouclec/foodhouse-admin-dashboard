## Directory Structure

* `migrations` - This directory holds the database migrations. Run `make create-migration name=my_new_migration` to create new migration files.
* `query` - This directory holds your SQL queries. Go code will be generated from the sql statements in these files.
* `repo` - This package should be imported to interact with the postgres database. This package wraps the generated sqlc code.
* `sqlc` - This directory holds the generated go code. Don't modify anything in this directory. Als do not import this package directly, use the wrapper package `repo`.
