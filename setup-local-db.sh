#!/bin/bash
# Create database and user for local PostgreSQL

# Try to connect and create database
psql -U postgres -c "CREATE DATABASE hooklog;" 2>/dev/null || \
psql -d postgres -c "CREATE DATABASE hooklog;" 2>/dev/null || \
psql -c "CREATE DATABASE hooklog;" 2>/dev/null || \
echo "Please run: createdb hooklog"

# Create user (if needed)
psql -U postgres -c "CREATE USER hooklog WITH PASSWORD 'hooklog_password';" 2>/dev/null || \
psql -d postgres -c "CREATE USER hooklog WITH PASSWORD 'hooklog_password';" 2>/dev/null || \
echo "User creation skipped (may already exist)"

# Grant privileges
psql -U postgres -d hooklog -c "GRANT ALL PRIVILEGES ON DATABASE hooklog TO hooklog;" 2>/dev/null || \
psql -d hooklog -c "GRANT ALL PRIVILEGES ON DATABASE hooklog TO hooklog;" 2>/dev/null || \
echo "Please grant privileges manually"

echo "Database setup complete!"
