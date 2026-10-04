import os

# Define la estructura de carpetas y archivos
structure = {
    "index.html": "",
    "css": {
        "main.css": "",
        "map.css": "",
        "modals.css": ""
    },
    "js": {
        "config.js": "",
        "supabaseClient.js": "",
        "map.js": "",
        "zones.js": "",
        "employees.js": "",
        "activities.js": "",
        "app.js": ""
    },
    "assets": {}
}

def create_structure(base_path, obj):
    for name, content in obj.items():
        current_path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(current_path, exist_ok=True)
            create_structure(current_path, content)
        else:
            if not os.path.exists(current_path):
                with open(current_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Creado: {current_path}")

if __name__ == "__main__":
    create_structure(".", structure)
    print("¡Estructura creada con éxito!")