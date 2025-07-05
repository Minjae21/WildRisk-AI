import pandas as pd
import numpy as np

# Download the dataset from kaggle and use the it as the file_path below: https://www.kaggle.com/datasets/behroozsohrabi/us-wildfire-records-6th-edition?resource=download
file_path = '~/Downloads/wildfire_history.csv'
df = pd.read_csv(file_path)

mixed_type_columns = ['SOURCE_REPORTING_UNIT', 'LOCAL_FIRE_REPORT_ID', 'LOCAL_INCIDENT_ID','FIRE_CODE', 'FIRE_NAME', 'ICS_209_PLUS_INCIDENT_JOIN_ID','ICS_209_PLUS_COMPLEX_JOIN_ID', 'MTBS_ID', 'MTBS_FIRE_NAME', 'COMPLEX_NAME', 'NWCG_CAUSE_AGE_CATEGORY', 'COUNTY', 'FIPS_NAME']

for col in mixed_type_columns:
    df[col] = df[col].astype(str)

columns_to_remove = ['LOCAL_FIRE_REPORT_ID', 'LOCAL_INCIDENT_ID', 'COUNTY', 
                     'FIPS_CODE', 'FIPS_NAME', 'SOURCE_REPORTING_UNIT', 
                     'SOURCE_REPORTING_UNIT_NAME', 'ICS_209_PLUS_INCIDENT_JOIN_ID', 
                     'ICS_209_PLUS_COMPLEX_JOIN_ID', 'MTBS_ID', 'MTBS_FIRE_NAME', 
                     'FIRE_CODE', 'FIRE_NAME']

df.drop(columns=columns_to_remove, inplace=True)


df['DISCOVERY_DATE'] = pd.to_datetime(df['DISCOVERY_DATE'], errors='coerce')
df['CONT_DATE'] = pd.to_datetime(df['CONT_DATE'], errors='coerce')


df['FIRE_DURATION'] = (df['CONT_DATE'] - df['DISCOVERY_DATE']).dt.days


df['FIRE_DURATION'] = pd.to_numeric(df['FIRE_DURATION'], errors='coerce')
df['FIRE_DURATION'].fillna(df['FIRE_DURATION'].median(), inplace=True)


categorical_columns = ['NWCG_CAUSE_CLASSIFICATION', 'FIRE_SIZE_CLASS', 'STATE']
df = pd.get_dummies(df, columns=categorical_columns)

for col in df.columns:
    if df[col].dtype == 'object':
        try:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        except ValueError:
            continue


numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())


df.to_csv('Processed_US_Wildfires.csv', index=False)
