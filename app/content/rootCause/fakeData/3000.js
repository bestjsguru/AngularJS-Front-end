export default {
    "root_cause": {
        "metrics": [
            {"type": "BEFORE", "metric_id": 12566, "vals": [2000, 2000, 2000, 2000, 500, 500, 500, 500, 200, 200]},
            {"type": "AFTER", "metric_id": 12566, "vals": [1995, 1995, 1995, 1995, 501, 501, 501, 501, 197, 207]},
            {"type": "DIFF", "metric_id": 12566, "vals": [-5, -5, -5, -5, 1, 1, 1, 1, -3, 7]},
            {"type": "BEFORE", "metric_id": 12567, "vals": [2.625, 2.4375, 2.8125, 3.0625, 2.5, 2.5, 2.5, 0.25, 0.625, 0.625]},
            {
                "type": "AFTER",
                "metric_id": 12567,
                "vals": [0.1253, 0.0879, 0.554, 0.880, 1.2475, 1.4471, 1.5444, 0.0374, 0.5521, 1.0896]
            },
            {
                "type": "DIFF",
                "metric_id": 12567,
                "vals": [-2.4997, -2.3496, -2.2585, -2.1825, -1.2525, -1.0529, -0.9556, -0.2126, -0.0729, 0.4646]
            },
            {"type": "BEFORE", "metric_id": 12568, "vals": [80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.0]},
            {"type": "AFTER", "metric_id": 12568, "vals": [80.0, 80.0, 80.0, 80.0, 80.0, 80.0, 80.50, 80.15, 80.20, 75.60]},
            {"type": "DIFF", "metric_id": 12568, "vals": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.50, 0.15, 0.20, -4.50]},
            {"type": "BEFORE", "metric_id": 12565, "vals": [4200, 3900, 4500, 4900, 1000.0, 1000.0, 1000.0, 100.0, 100.0, 100.0]},
            {
                "type": "AFTER",
                "metric_id": 12565,
                "vals": [200.0, 140.4, 884.85, 1404.25, 500.0, 580.0, 619.0, 15.0, 87.01, 180.45]
            },
            {
                "type": "DIFF",
                "metric_id": 12565,
                "vals": [-4000.00, -3759.60, -3615.15, -3495.75, -500.00, -420.00, -381.00, -85.00, -12.99, 80.45]
            }],
        'likeForLike': [0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
        "dimensions": [
            {
                "dimension_name": "Department",
                "vals": ["Womenswear", "Womenswear", "Menswear", "Menswear", "Home", "Children", "Menswear", "MensWear", "Home",
                         "Womenswear"]
            },
            {
                "dimension_name": "Category",
                "vals": ["Jeans", "Jeans", "Jeans", "Jeans", "Candles", "Toddler - Girl", "Shirts", "Shirts", "Mirrors",
                         "Evening Dresses"]
            },
            {
                "dimension_name": "Product",
                "vals": ["Levis 711 - Skinny", "Levis 711 - Skinny", "Levis 511", "Levis 501", "Pecknsniff Lavender",
                         "Baby Polka Dress", "Versace Medusa", "RL Polo", "Round 50cm", "Venetian Embroidered"]
            },
            {
                "dimension_name": "Colour",
                "vals": ["Black", "Blue", "Khaki", "Indigo", "None", "White", "Black", "Green", "Silver", "Multi"]
            }
        ]
    },
    
    "metrics_impact": [
        {
            "metric_id": 12566,
            "control": 1549.0,
            "test": 1697.0,
            "difference": 148.0,
            "metric_type": "driver",
            "metric_name": "Page Views",
            "impact": -3917.15,
            "sort": 2,
            "symbol": ""
        },
        {
            "metric_id": 12567,
            "control": 2.41,
            "test": 2.47,
            "difference": 0.06,
            "metric_type": "driver",
            "metric_name": "Conversion Rate",
            "impact": -12117.50,
            "sort": 3,
            "symbol": "%"
        },
        {
            "metric_id": 12568,
            "control": 37.59,
            "test": 37.4,
            "difference": -0.19,
            "metric_type": "driver",
            "metric_name": "Price",
            "impact": 20.05,
            "sort": 4,
            "symbol": "£"
        },
        {
            "metric_id": 12565,
            "control": 115766.60,
            "test": 99752.00,
            "difference": -16014.60,
            "metric_type": "goal",
            "metric_name": "Sales",
            "impact": -16014.60,
            "sort": 1,
            "symbol": "£"
        }
    ],
    "top_reasons": [
        {"dimension": "Category", "value": "Jeans", "goal_diff": -14870.50, "percentage_explained": 0.442344},
        {"dimension": "Department", "value": "Womenswear", "goal_diff": -7759.60, "percentage_explained": 0.185644},
        {"dimension": "Product", "value": "Levis 711 - Skinny", "goal_diff": -7759.60, "percentage_explained": 0.184344},
        {"dimension": "Department", "value": "Menswear", "goal_diff": -7110.90, "percentage_explained": 0.135644},
        {"dimension": "Colour", "value": "Black", "goal_diff": -4000.00, "percentage_explained": 0.069844},
    ]
};
