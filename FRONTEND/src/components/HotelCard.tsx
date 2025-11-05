import React from "react";
import { Link } from "react-router-dom";
import type { HotelListItem } from "@/types/hotel";

interface HotelCardProps {
  hotel: HotelListItem;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border border-gray-100">
      <Link to={`/hotels/${hotel.slug}`} className="block relative h-48 sm:h-56">
        <img
          src={hotel.primary_image_url || "https://via.placeholder.com/400x300?text=No+Image"}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-medium shadow-sm flex items-center space-x-1">
          <span className="text-yellow-500">★</span>
          <span>{hotel.star_rating}</span>
        </div>
      </Link>
      
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/hotels/${hotel.slug}`} className="block flex-grow pr-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
              {hotel.name}
            </h3>
          </Link>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="bg-blue-600 text-white font-bold px-2 py-1 rounded text-sm mb-1">
              {hotel.avg_rating.toFixed(1)}
            </div>
            <span className="text-xs text-gray-500">{hotel.review_count} reviews</span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 text-sm mb-4">
          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{hotel.city}, {hotel.country}</span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Starting from</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(hotel.min_price)}</p>
          </div>
          <Link 
            to={`/hotels/${hotel.slug}`}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
