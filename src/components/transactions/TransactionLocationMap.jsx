import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

// Custom marker icon for location map
const createLocationMapIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          width: 5px;
          height: 5px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'location-map-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9]
  });
};

export default function TransactionLocationMap({ transaction, mapboxToken }) {
  // Only show map if transaction has coordinates
  const hasCoordinates = transaction?.latitude && transaction?.longitude;

  if (!hasCoordinates) {
    return (
      <Card className="clay-element border-0">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Property Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No location data available</p>
            <p className="text-sm text-gray-400">Location coordinates will be added automatically</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!mapboxToken) {
    return (
        <Card className="clay-element border-0">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Property Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full rounded-xl bg-gray-200 animate-pulse flex items-center justify-center">
                <p className="text-gray-500">Loading map...</p>
            </div>
          </CardContent>
        </Card>
      );
  }

  return (
    <Card className="clay-element border-0">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3">
          <MapPin className="w-5 h-5 text-indigo-600" />
          Property Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full rounded-xl overflow-hidden">
          <MapContainer 
            center={[transaction.latitude, transaction.longitude]} 
            zoom={15} 
            scrollWheelZoom={false} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`}
            />
            <Marker 
              position={[transaction.latitude, transaction.longitude]}
              icon={createLocationMapIcon()}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-semibold text-sm text-gray-900 mb-1">
                    {transaction.property_address}
                  </div>
                  <div className="text-green-600 font-medium text-sm">
                    {transaction.sales_price ? `$${transaction.sales_price.toLocaleString()}` : 'Price TBD'}
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}