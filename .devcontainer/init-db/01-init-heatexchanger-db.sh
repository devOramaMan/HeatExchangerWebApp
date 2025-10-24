#!/bin/bash
set -e

# This script runs when the PostgreSQL container starts for the first time
echo "Initializing Heat Exchanger database..."

# Create additional schemas if needed
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create schemas for organizing data
    CREATE SCHEMA IF NOT EXISTS analytics;
    CREATE SCHEMA IF NOT EXISTS monitoring;
    CREATE SCHEMA IF NOT EXISTS historical;
    
    -- Create extensions that might be useful
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- Create initial tables for heat exchanger data
    CREATE TABLE IF NOT EXISTS monitoring.heat_exchanger_readings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        t1_outdoor_air_in_temperature DECIMAL(8,2),
        t2_supply_air_temperature DECIMAL(8,2),
        t3_extract_air_temperature DECIMAL(8,2),
        t4_exhaust_air_out_temperature DECIMAL(8,2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create efficiency history table for graphing
    CREATE TABLE IF NOT EXISTS historical.efficiency_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recorded_date DATE NOT NULL,
        average_efficiency DECIMAL(5,2),
        max_efficiency DECIMAL(5,2),
        min_efficiency DECIMAL(5,2),
        sample_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_heat_readings_timestamp 
        ON monitoring.heat_exchanger_readings(timestamp);
    CREATE INDEX IF NOT EXISTS idx_efficiency_history_date 
        ON historical.efficiency_history(recorded_date);
    
    -- Insert some sample data for development
    INSERT INTO monitoring.heat_exchanger_readings 
        (t1_outdoor_air_in_temperature, t2_supply_air_temperature, t3_extract_air_temperature, t4_exhaust_air_out_temperature)
    VALUES
        (5.0, 18.0, 20.0, 8.0),
        (4.5, 17.5, 19.8, 7.8),
        (5.5, 18.5, 20.2, 8.2);
    
    INSERT INTO historical.efficiency_history 
        (recorded_date, average_efficiency, max_efficiency, min_efficiency, sample_count)
    VALUES
        (CURRENT_DATE - INTERVAL '7 days', 85.2, 88.1, 82.3, 144),
        (CURRENT_DATE - INTERVAL '6 days', 86.1, 89.2, 83.1, 142),
        (CURRENT_DATE - INTERVAL '5 days', 84.8, 87.5, 81.9, 145);
    
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA monitoring TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA historical TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO $POSTGRES_USER;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA monitoring TO $POSTGRES_USER;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA historical TO $POSTGRES_USER;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA analytics TO $POSTGRES_USER;
    
    -- Create a function to update the updated_at timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    \$\$ language 'plpgsql';
    
    -- Create trigger for auto-updating timestamps
    CREATE TRIGGER update_heat_exchanger_readings_updated_at 
        BEFORE UPDATE ON monitoring.heat_exchanger_readings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
EOSQL

echo "Heat Exchanger database initialization completed!"