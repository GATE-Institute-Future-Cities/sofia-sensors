import json

# Open the GeoJSON file for reading
with open('C:\\Users\\35987\\Desktop\\sofia-sensors\\EXEA DATA\\modified-heatmap.geojson', 'r') as geojson_file:
    data = json.load(geojson_file)

# Modify the "value" property in each feature
for feature in data['features']:
    if 'properties' in feature and 'value' in feature['properties']:
        try:
            # Attempt to convert "value" to a float
            feature['properties']['value'] = float(feature['properties']['value'])
        except (ValueError, TypeError):
            # Handle any exceptions when conversion fails
            pass

# Save the modified GeoJSON to a new file
with open('heatmap_geojson_file.geojson', 'w') as modified_file:
    json.dump(data, modified_file)

print('Conversion completed and saved to modified_geojson_file.geojson')
