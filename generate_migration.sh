#!/bin/bash

MIGRATION_NAME=$1

if [ -z "$MIGRATION_NAME" ]; then
  echo "❌ Please provide a migration name."
  echo "Usage: ./generate_migration.sh create-users"
  exit 1
fi

TIMESTAMP=$(date -u +"%Y%m%d%H%M%S")
FILENAME="${TIMESTAMP}-${MIGRATION_NAME}.ts"
FILEPATH="src/migrations/${FILENAME}"

mkdir -p src/migrations

cat > "$FILEPATH" <<EOL
import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // TODO: Define table creation here
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // TODO: Define rollback here
  },
};
EOL

echo "✅ Migration created: $FILEPATH"
