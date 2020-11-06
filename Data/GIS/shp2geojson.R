library(sf)
library(dplyr)
library(geojsonio)

shape <- st_read("Data/MSOA2011_BGC.shp") %>%
    st_transform("+proj=longlat +datum=WGS84 +init=epsg:3035") %>%
    rename(
        c(
            MSOA2011 = MSOA11CD
        )
    ) %>%
    select(
        -c(
            MSOA11NM, MSOA11NMW
        )
    )

tmp <- geojson_json(shape)
geojsonio::geojson_write(
    tmp,
    geometry = "polygon",
    file = "Data/MSOA2011_BGC.geojson"
)
