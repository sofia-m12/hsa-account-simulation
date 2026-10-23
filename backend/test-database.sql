CREATE DATABASE hsa_test;
\connect hsa_test
\i /docker-entrypoint-initdb.d/01-schema.sql
