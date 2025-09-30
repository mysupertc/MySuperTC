import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { createPageUrl } from '@/utils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom marker icon - clean black circle with white dot (matching Mapbox style)
const createCustomIcon = (color = '#000000') => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-map-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active_contingent': return '#eab308'; // yellow-500
    case 'active_noncontingent': return '#3b82f6'; // blue-500
    case 'seller_in_possession': return '#8b5cf6'; // purple-500
    case 'closed': return '#6b7280'; // gray-500
    case 'cancelled': return '#ef4444'; // red-500
    case 'pre_listing': return '#22c55e'; // green-500
    case 'listed': return '#10b981'; // emerald-500
    default: return '#000000'; // black default
  }
};

export default function TransactionsMap({ transactions, mapboxToken }) {
    const transactionsWithCoords = transactions.filter(t => t.latitude && t.longitude);
    const center = transactionsWithCoords.length > 0
        ? [transactionsWithCoords[0].latitude, transactionsWithCoords[0].longitude]
        : [34.0522, -118.2437]; // Default to Los Angeles

    if (typeof window === 'undefined' || !mapboxToken) {
        return <div className="h-[500px] w-full bg-gray-200 animate-pulse rounded-2xl" />;
    }

    const handleMarkerClick = (transactionId) => {
        window.location.href = createPageUrl("TransactionDetail", `id=${transactionId}`);
    };

    return (
        <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-lg">
            <MapContainer 
                center={center} 
                zoom={10} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
                    url={`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`}
                />
                {transactionsWithCoords.map(transaction => (
                    <Marker 
                        key={transaction.id} 
                        position={[transaction.latitude, transaction.longitude]}
                        icon={createCustomIcon(getStatusColor(transaction.status))}
                        eventHandlers={{
                            click: () => handleMarkerClick(transaction.id),
                        }}
                    >
                        <Popup>
                            <div 
                                className="cursor-pointer hover:bg-gray-50 p-2 rounded min-w-[200px]"
                                onClick={() => handleMarkerClick(transaction.id)}
                            >
                                <div className="font-semibold text-sm text-gray-900 mb-1">
                                    {transaction.property_address}
                                </div>
                                <div className="text-green-600 font-medium text-sm">
                                  {transaction.sales_price ? `$${transaction.sales_price.toLocaleString()}` : 'Price TBD'}
                                </div>
                                <div className="capitalize text-gray-600 text-xs mb-2">
                                  {transaction.status.replace(/_/g, ' ')}
                                </div>
                                <div className="text-blue-600 text-xs font-medium">
                                    Click to view details →
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            
            <style jsx>{`
                .custom-map-marker:hover {
                    transform: scale(1.1);
                    transition: transform 0.2s ease;
                }
            `}</style>
        </div>
    );
}