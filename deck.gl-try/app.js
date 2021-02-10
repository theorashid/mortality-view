import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import mapboxgl from 'mapbox-gl';

// source: ONS Open Geography Portal: https://geoportal.statistics.gov.uk
const SHAPE =
    "./Data/GIS/MSOA2011_BSC_eng.geojson";

// Leicester
const INITIAL_VIEW_STATE = {
    latitude: 52.6386,
    longitude: -1.13169,
    zoom: 5.5,
    bearing: 0,
    pitch: 0
};

// basemap
const MAP_STYLE =
    // 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
    'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const map = new mapboxgl.Map({
    container: 'map',
    style: MAP_STYLE,
    // Note: deck.gl will be in charge of interaction and event handling
    interactive: false,
    center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
    zoom: INITIAL_VIEW_STATE.zoom,
    bearing: INITIAL_VIEW_STATE.bearing,
    pitch: INITIAL_VIEW_STATE.pitch
});

function getTooltip({ object }) {
    return (
        object && {
            html: `\
    <div><b>MSOA Code</b></div>
    <div>${object.properties.MSOA2011}</div>
    `
        }
    );
}

export const deck = new Deck({
    canvas: 'deck-canvas',
    width: '100%',
    height: '100%',
    initialViewState: INITIAL_VIEW_STATE,
    controller: true,
    onViewStateChange: ({ viewState }) => {
        map.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch
        });
    },
    layers: [
        new GeoJsonLayer({
            id: 'airports',
            data: SHAPE,
            // Styles
            stroked: true,
            filled: true,
            extruded: false,
            lineWidthMinPixels: 1,
            opacity: 0.6,
            getLineColor: [112, 128, 144],
            getFillColor: [176, 196, 222],
            // Interactive props
            pickable: true,
            autoHighlight: true,
            onClick: info =>
                // eslint-disable-next-line
                info.object && alert(`${info.object.properties.MSOA2011}`)
        })
    ]
});