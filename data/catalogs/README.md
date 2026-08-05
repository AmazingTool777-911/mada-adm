# Data catalogs

This folder houses catalogs of Madagascar's administratives boundaries data
organized in **hierarchy** for each level in both the **CSV** format and the
**JSON** format.

## Table of Contents

- [Folder Structure & Files](#folder-structure--files)
- [Provinces Catalog](#provinces-catalog)
  - [Provinces (CSV)](#provinces-csv)
  - [Provinces (JSON)](#provinces-json)
- [Regions Catalog](#regions-catalog)
  - [Regions (CSV)](#regions-csv)
  - [Regions (JSON)](#regions-json)
  - [Regions by Province (JSON)](#regions-by-province-json)
- [Districts Catalog](#districts-catalog)
  - [Districts (CSV)](#districts-csv)
  - [Districts (JSON)](#districts-json)
  - [Districts by Region (JSON)](#districts-by-region-json)
  - [Districts by Province (JSON)](#districts-by-province-json)
- [Communes Catalog](#communes-catalog)
  - [Communes (CSV)](#communes-csv)
  - [Communes (JSON)](#communes-json)
  - [Communes by District (JSON)](#communes-by-district-json)
  - [Communes by Region (JSON)](#communes-by-region-json)
  - [Communes by Province (JSON)](#communes-by-province-json)
- [Fokontanys Catalog](#fokontanys-catalog)
  - [Fokontanys (CSV)](#fokontanys-csv)
  - [Fokontanys (JSON)](#fokontanys-json)
  - [Fokontanys by Commune (JSON)](#fokontanys-by-commune-json)
  - [Fokontanys by District (JSON)](#fokontanys-by-district-json)
  - [Fokontanys by Region (JSON)](#fokontanys-by-region-json)
  - [Fokontanys by Province (JSON)](#fokontanys-by-province-json)

## Folder Structure & Files

Here is the folder structure of the catalogs:

```
├── catalogs
│   ├── .generated
│   ├── ├── <timestamp>
│   ├── ├── ├── ... generated data catalogs by the script
│   ├── province
│   │   ├── provinces.csv
│   │   ├── provinces.json
│   ├── region
│   │   ├── regions.csv
│   │   ├── regions.json
│   │   ├── regions-by-province.json
│   ├── district
│   │   ├── districts.csv
│   │   ├── districts.json
│   │   ├── districts-by-region.json
│   │   ├── districts-by-province.json
│   ├── commune
│   │   ├── communes.csv
│   │   ├── communes.json
│   │   ├── communes-by-district.json
│   │   ├── communes-by-region.json
│   │   ├── communes-by-province.json
│   ├── fokontany
│   │   ├── fokontanys.csv
│   │   ├── fokontanys.json
│   │   ├── fokontanys-by-commune.json
│   │   ├── fokontanys-by-district.json
│   │   ├── fokontanys-by-region.json
│   │   ├── fokontanys-by-province.
```

## Catalogs Generation

To generate the catalogs, run the following command:

```bash
deno task generate-catalogs
```

This will generate the catalogs in the `.generated` folder under a unique
timestamp folder. Only then will you copy those files to the `data/catalogs`
folder because it is **not recommended** to directly modify the committed data
catalogs.

## Provinces Catalog

The provinces data catalog can be found under the `province/` folder.

### Provinces (CSV)

The provinces data catalog in CSV format is located under the `provinces.csv`
file.

```csv
province
Toliara
Antsiranana
Mahajanga
Antananarivo
Toamasina
Fianarantsoa
```

### Provinces (JSON)

The provinces data catalog in JSON format is located inside the `provinces.json`
file.

```json
[
  {
    "province": "Toliara"
  },
  {
    "province": "Antsiranana"
  },
  {
    "province": "Mahajanga"
  },
  {
    "province": "Antananarivo"
  },
  {
    "province": "Toamasina"
  },
  {
    "province": "Fianarantsoa"
  }
]
```

## Regions Catalog

The regions data catalog can be found under the `region/` folder.

### Regions (CSV)

The regions data catalog in CSV format is located inside the `regions.csv` file.

```csv
region,province
Analamanga,Antananarivo
Bongolava,Antananarivo
Itasy,Antananarivo
Atsimo-Andrefana,Toliara
Ihorombe,Fianarantsoa
...
```

### Regions (JSON)

The regions data catalog in JSON format is located inside the `regions.json`
file.

```json
[
  {
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  {
    "region": "Bongolava",
    "province": "Antananarivo"
  },
  {
    "region": "Itasy",
    "province": "Antananarivo"
  },
  {
    "region": "Atsimo-Andrefana",
    "province": "Toliara"
  },
  {
    "region": "Ihorombe",
    "province": "Fianarantsoa"
  },
  ...
]
```

### Regions by Province (JSON)

The regions by province data catalog in JSON format is located inside the
`regions-by-province.json` file.

```json
[
  {
    "province": "Antananarivo",
    "regions": [
      {
        "region": "Analamanga"
      },
      {
        "region": "Bongolava"
      },
      {
        "region": "Itasy"
      },
      {
        "region": "Vakinankaratra"
      }
    ]
  },
  ...
]
```

## Districts Catalog

The districts data catalog can be found under the `district/` folder.

### Districts (CSV)

The districts data catalog in CSV format is located inside the `districts.csv`
file.

```csv
district,region,province
1er Arrondissement,Analamanga,Antananarivo
2e Arrondissement,Analamanga,Antananarivo
3e Arrondissement,Analamanga,Antananarivo
4e Arrondissement,Analamanga,Antananarivo
5e Arrondissement,Analamanga,Antananarivo
6e Arrondissement,Analamanga,Antananarivo
Antananarivo Avaradrano,Analamanga,Antananarivo
Ambohidratrimo,Analamanga,Antananarivo
...
```

### Districts (JSON)

The districts data catalog in JSON format is located inside the `districts.json`
file.

```json
[
  {
    "district": "1er Arrondissement",
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  {
    "district": "2e Arrondissement",
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  {
    "district": "3e Arrondissement",
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  ...
]
```

### Districts by Region (JSON)

The districts by region data catalog in JSON format is located inside the
`districts-by-region.csv` file.

```json
[
  {
    "region": "Analamanga",
    "province": "Antananarivo",
    "districts": [
      {
        "district": "1er Arrondissement"
      },
      {
        "district": "2e Arrondissement"
      },
      {
        "district": "3e Arrondissement"
      },
      {
        "district": "4e Arrondissement"
      },
    ...
    ]
  },
  ...
]
```

### Districts by Province (JSON)

The districts by province data catalog in JSON format is located inside the
`districts-by-province.json` file.

```json
[
  {
    "province": "Antananarivo",
    "regions": [
      {
        "region": "Analamanga",
        "districts": [
          {
            "district": "1er Arrondissement"
          },
          {
            "district": "2e Arrondissement"
          },
          {
            "district": "3e Arrondissement"
          },
          {
            "district": "4e Arrondissement"
          },
          ...
        ]
      },
      ...
    ]
  },
  ...  
]
```

## Communes Catalog

The communes data catalog can be found under the `commune/` folder.

### Communes (CSV)

The communes data catalog in CSV format is located inside the `communes.csv`
file.

```csv
commune,district,region,province
Ambohimangakely,Antananarivo Avaradrano,Analamanga,Antananarivo
Manandriana,Antananarivo Avaradrano,Analamanga,Antananarivo
Ambohimalaza Miray,Antananarivo Avaradrano,Analamanga,Antananarivo
Fiaferana,Antananarivo Avaradrano,Analamanga,Antananarivo
Ambohimanga Rova,Antananarivo Avaradrano,Analamanga,Antananarivo
Viliahazo,Antananarivo Avaradrano,Analamanga,Antananarivo
Talata Volonondry,Antananarivo Avaradrano,Analamanga,Antananarivo
Anjeva Gara,Antananarivo Avaradrano,Analamanga,Antananarivo
Masindray,Antananarivo Avaradrano,Analamanga,Antananarivo
...
```

### Communes (JSON)

The communes data catalog in JSON format is located inside the `communes.json`
file.

```json
[
  {
    "commune": "Ambohimangakely",
    "district": "Antananarivo Avaradrano",
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  {
    "commune": "Manandriana",
    "district": "Antananarivo Avaradrano",
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  {
    "commune": "Ambohimalaza Miray",
    "district": "Antananarivo Avaradrano",
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  {
    "commune": "Fiaferana",
    "district": "Antananarivo Avaradrano",
    "region": "Analamanga",
    "province": "Antananarivo"
  },
  ...
]
```

### Communes by District (JSON)

The communes by district data catalog in JSON format is located inside the
`communes-by-district.json` file.

```json
[
  {
    "district": "Antananarivo Avaradrano",
    "region": "Analamanga",
    "province": "Antananarivo",
    "communes": [
      {
        "commune": "Ambohimangakely"
      },
      {
        "commune": "Manandriana"
      },
      {
        "commune": "Ambohimalaza Miray"
      },
      {
        "commune": "Fiaferana"
      },
      {
        "commune": "Ambohimanga Rova"
      },
      ...
    ]
  },
  ...  
]
```

### Communes by Region (JSON)

The communes by region data catalog in JSON format is located inside the
`communes-by-region.json` file.

```json
[
  {
    "region": "Analamanga",
    "province": "Antananarivo",
    "districts": [
      {
        "district": "Antananarivo Avaradrano",
        "communes": [
          {
            "commune": "Ambohimangakely"
          },
          {
            "commune": "Manandriana"
          },
          {
            "commune": "Ambohimalaza Miray"
          },
          {
            "commune": "Fiaferana"
          },
          {
            "commune": "Ambohimanga Rova"
          },
          ...
        ]
      },
      ...
    ]
  },
  ...  
]
```

### Communes by Province (JSON)

The communes by province data catalog in JSON format is located inside the
`communes-by-province.json` file.

```json
[
  {
    "province": "Antananarivo",
    "regions": [
      {
        "region": "Analamanga",
        "districts": [
          {
            "district": "Antananarivo Avaradrano",
            "communes": [
              {
                "commune": "Ambohimangakely"
              },
              {
                "commune": "Manandriana"
              },
              {
                "commune": "Ambohimalaza Miray"
              },
              {
                "commune": "Fiaferana"
              },
              {
                "commune": "Ambohimanga Rova"
              },
              ...
            ]
          },
          ...
        ]
      },
      ...  
    ]
  },
  ...
]
```

## Fokontanys Catalog

The fokontanys data catalog can be found under the `fokontany/` folder.

### Fokontanys (CSV)

The fokontany data catalog in CSV format is located inside the `fokontany.csv`
file.

```csv
fokontany,commune,district,region,province
Ampasina,Andina,Ambositra,Amoron'i Mania,Fianarantsoa
Antanifotsy,Andina,Ambositra,Amoron'i Mania,Fianarantsoa
Amboloando,Andiolava,Ihosy,Ihorombe,Fianarantsoa
Vatambe Nanarena,Andiolava,Ihosy,Ihorombe,Fianarantsoa
Vohimary,Andiolava,Ihosy,Ihorombe,Fianarantsoa
Maroadabohely,Andohajango,Mandritsara,Sofia,Mahajanga
Andohajango,Andohajango,Mandritsara,Sofia,Mahajanga
Antendrombohilava,Andilana Nord,Amparafaravola,Alaotra-Mangoro,Toamasina
Ampasika,Andilana Nord,Amparafaravola,Alaotra-Mangoro,Toamasina
Morarano Mandroso,Andilana Nord,Amparafaravola,Alaotra-Mangoro,Toamasina
...
```

### Fokontanys (JSON)

The fokontanys data catalog in JSON format is located inside the
`fokontany.json` file.

```json
[
  {
    "fokontany": "Ampasina",
    "commune": "Andina",
    "district": "Ambositra",
    "region": "Amoron'i Mania",
    "province": "Fianarantsoa"
  },
  {
    "fokontany": "Antanifotsy",
    "commune": "Andina",
    "district": "Ambositra",
    "region": "Amoron'i Mania",
    "province": "Fianarantsoa"
  },
  {
    "fokontany": "Amboloando",
    "commune": "Andiolava",
    "district": "Ihosy",
    "region": "Ihorombe",
    "province": "Fianarantsoa"
  },
  {
    "fokontany": "Vatambe Nanarena",
    "commune": "Andiolava",
    "district": "Ihosy",
    "region": "Ihorombe",
    "province": "Fianarantsoa"
  },
  ...
]
```

### Fokontanys by Commune (JSON)

The fokontanys by commune data catalog in JSON format is located inside the
`fokontanys-by-commune.json` file.

```json
[
  {
    "commune": "Andina",
    "district": "Ambositra",
    "region": "Amoron'i Mania",
    "province": "Fianarantsoa",
    "fokontanys": [
      {
        "fokontany": "Ampasina"
      },
      {
        "fokontany": "Antanifotsy"
      },
      {
        "fokontany": "Ampamahotra"
      },
      {
        "fokontany": "Talaky"
      },
      {
        "fokontany": "Ambalamarina"
      },
      ...
    ]
  },
  ...  
]
```

### Fokontanys by District (JSON)

The fokontanys by district data catalog in JSON format is located inside the
`fokontanys-by-district.json` file.

```json
[
  {
    "district": "Ambositra",
    "region": "Amoron'i Mania",
    "province": "Fianarantsoa",
    "communes": [
      {
        "commune": "Andina",
        "fokontanys": [
          {
            "fokontany": "Ampasina"
          },
          {
            "fokontany": "Antanifotsy"
          },
          {
            "fokontany": "Ampamahotra"
          },
          {
            "fokontany": "Talaky"
          },
          {
            "fokontany": "Ambalamarina"
          },
          ...  
        ]
      },
      ...
    ]
  },
  ...
]
```

### Fokontanys by Region (JSON)

The fokontanys by region data catalog in JSON format is located inside the
`fokontanys-by-region.json` file.

```json
[
  {
    "region": "Amoron'i Mania",
    "province": "Fianarantsoa",
    "districts": [
      {
        "district": "Ambositra",
        "communes": [
          {
            "commune": "Andina",
            "fokontanys": [
              {
                "fokontany": "Ampasina"
              },
              {
                "fokontany": "Antanifotsy"
              },
              {
                "fokontany": "Ampamahotra"
              },
              {
                "fokontany": "Talaky"
              },
              {
                "fokontany": "Ambalamarina"
              },
              ...
            ]
          },
          ...
        ]
      },
      ...
    ]
  }
  ...  
]
```

### Fokontanys by Province (JSON)

The fokontanys by province data catalog in JSON format is located inside the
`fokontanys-by-province.json` file.

```json
[
  {
    "province": "Fianarantsoa",
    "regions": [
      {
        "region": "Amoron'i Mania",
        "districts": [
          {
            "district": "Ambositra",
            "communes": [
              {
                "commune": "Andina",
                "fokontanys": [
                  {
                    "fokontany": "Ampasina"
                  },
                  {
                    "fokontany": "Antanifotsy"
                  },
                  {
                    "fokontany": "Ampamahotra"
                  },
                  {
                    "fokontany": "Talaky"
                  },
                  {
                    "fokontany": "Ambalamarina"
                  },
                  {
                    "fokontany": "Anjama Ivo"
                  },
                  ...
                ]
              },
              ...  
            ]
          },
          ...  
        ]
      }
      ...
    ]
  }  
  ...
]
```
