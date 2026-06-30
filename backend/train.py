import os
import pandas as pd
import numpy as np
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

def train_model(csv_path="dataset.csv", model_output_path="livability_model.pkl"):
    if not os.path.exists(csv_path):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, "dataset.csv")
        model_output_path = os.path.join(script_dir, "livability_model.pkl")
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset not found at {csv_path}.")

    df = pd.read_csv(csv_path)
    target_col = 'livability_score'

    numeric_features = [
        'aqi', 'temperature', 'humidity', 'green_cover', 
        'hospital_density', 'school_density', 'internet_score', 
        'population_density', 'crime_rate', 
        'employment_rate', 'cost_of_living'
    ]
    nominal_features = ['climate_zone']
    ordinal_features = ['development_tier']

    num_cols = [col for col in numeric_features if col in df.columns]
    nom_cols = [col for col in nominal_features if col in df.columns]
    ord_cols = [col for col in ordinal_features if col in df.columns]

    print(f"Training features - Numeric: {num_cols}, Nominal: {nom_cols}, Ordinal: {ord_cols}")

    df_clean = df.dropna(subset=[target_col])
    print(f"Dataset shape after dropping rows with null target: {df_clean.shape}")

    X = df_clean[num_cols + nom_cols + ord_cols]
    y = df_clean[target_col].values


    transformers = []
    if num_cols:
        num_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('knn_imputer', KNNImputer(n_neighbors=3)),
            ('scaler', StandardScaler())
        ])
        transformers.append(('num', num_transformer, num_cols))

    if nom_cols:
        nom_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        transformers.append(('nom', nom_transformer, nom_cols))

    if ord_cols:
        ord_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('ordinal', OrdinalEncoder(categories=[['Tier 3', 'Tier 2', 'Tier 1']], handle_unknown='use_encoded_value', unknown_value=-1))
        ])
        transformers.append(('ord', ord_transformer, ord_cols))

    preprocessor = ColumnTransformer(transformers=transformers)


    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=50, max_depth=4, random_state=42))
    ])

    pipeline.fit(X, y)

    y_pred = pipeline.predict(X)
    mse = mean_squared_error(y, y_pred)
    r2 = r2_score(y, y_pred)

    importances = pipeline.named_steps['regressor'].feature_importances_
    feature_names_out = pipeline.named_steps['preprocessor'].get_feature_names_out()


    cleaned_feature_names = []
    for name in feature_names_out:
        cleaned_name = name
        for prefix in ['num__', 'nom__', 'ord__']:
            if cleaned_name.startswith(prefix):
                cleaned_name = cleaned_name[len(prefix):]
                break
        cleaned_feature_names.append(cleaned_name)

    feature_importances = {name: float(imp) for name, imp in zip(cleaned_feature_names, importances)}
    feature_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    bundle = {
        "pipeline": pipeline,
        "feature_names": num_cols + nom_cols + ord_cols,
        "metrics": {
            "mse": float(mse),
            "r2": float(r2),
            "samples_count": len(y)
        },
        "feature_importances": feature_importances
    }
    
    joblib.dump(bundle, model_output_path)
    return bundle

if __name__ == "__main__":
    res = train_model()
    print(f"Model trained. R2: {res['metrics']['r2']:.4f}, MSE: {res['metrics']['mse']:.4f}")

