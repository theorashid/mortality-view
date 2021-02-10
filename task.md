# project brief
Create a data visualisation of life expectancy in England at MSOA level similar to the [UK Local Covid project](https://localcovid.info).

The static version of the map is on [Observable](https://observablehq.com/@theorashid/england-geojson). Note, you can make edits to the map or fork the project on the site. It works well as a sandbox, but it might not be suitable when customising for a particular website.

## Data
Data is held in `Data/`. The shape data is taken from the ONS [Open Geography Portal](https://geoportal.statistics.gov.uk/). These shapefiles are generalised to 20m. If performance is slow, we can generalise this more.
- Life expectancy data `MSOAnestede0.csv`. The variables below are taken from this dataset.
- MSOA shape data `MSOA2011_BGC.geojson`
- LAD shape data `LAD2020_BGC.geojson` (for stroke)

## Visualisation
- Map of England with __fill__ of median life expectancy (`e0med`) at MSOA level, palette `d3.interpolateRdBu` with white at the country average in 2018 (79.9 for male and 83.4 for female)
- White __stroke__ drawn at LAD level (see [ONS](https://www.ons.gov.uk/methodology/geography/ukgeographies/censusgeography) for an explanation of nested tiered geography system)
- __Slider__ between years 2002-2018 (`YEAR`)
- __Button__ between sexes (`sex`)
- On __hover__, highlight the MSOA and give the MSOA name (`MSOA`), MSOA code (`MSOA2011`), LAD name (`LAD2020NM`), region (`GOR2011NM`), year (`YEAR`), median life expectancy (`e0med`), 95% confidence interval (`e0ci95low` and `e0ci95upp`)
- On __click__, pin that MSOA

### Optional
The following can be added depending on the performance of the map above. The most important thing is to have a smoothly running site.
- On __click__, draw a line of median life expectancy vs year with 95% confidence intervals around the line. If possible, draw the median life expectancy vs year of all other MSOAs on the same plot (much lighter) –– see [Observable](https://observablehq.com/@theorashid/life-expectancy-evolution-for-msoas-in-england-men)
- Basemap (e.g. mapbox)
- Link to [model code repo](https://github.com/theorashid/mortality-statsmodel)
- Link to download life expectancy data