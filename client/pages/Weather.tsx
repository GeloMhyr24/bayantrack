import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Chatbot } from "@/components/Chatbot";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CloudRain, 
  MapPin, 
  Droplet, 
  Wind, 
  Sun, 
  Thermometer, 
  AlertTriangle,
  Cloud,
  CloudLightning,
  CloudSnow,
  Loader2,
  Info,
  ChevronRight
} from 'lucide-react';


// ---------------------------------------------------------------------------

export default function Weather() {
  const [weather, setWeather] = useState({
    current: {
      temp: "--°C",
      condition: "Loading...",
      heatIndex: "--°C",
      humidity: "--%",
      wind: "-- km/h",
      airQuality: "--",
      sunrise: "--:--",
      sunset: "--:--"
    },
    hourly: [] as any[],
    forecast: [] as any[],
    tips: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError("");
      try {
        const API_KEY = "7351848fbe1e2beafdcaa53c4ce57d90"; 
        const CITY = "Bacoor,PH";

        const currentRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`);
        const current = currentRes.data;
        const { lat, lon } = current.coord;

        const [forecastRes, airQualityRes] = await Promise.all([
          axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&units=metric&appid=${API_KEY}`),
          axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        ]);

        const forecastList = forecastRes.data.list;
        const airQualityIndex = airQualityRes.data.list[0].main.aqi;

        const getWeatherIcon = (condition: string) => {
          switch (condition) {
            case 'Clear': return Sun;
            case 'Clouds': return Cloud;
            case 'Rain': return CloudRain;
            case 'Thunderstorm': return CloudLightning;
            case 'Drizzle': return CloudRain;
            case 'Snow': return CloudSnow;
            default: return Cloud;
          }
        };

        const getAirQualityLabel = (aqi: number) => {
          switch (aqi) {
            case 1: return "Good";
            case 2: return "Fair";
            case 3: return "Moderate";
            case 4: return "Poor";
            case 5: return "Very Poor";
            default: return "Unknown";
          }
        };

        const generateTips = (condition: string, temp: number, windSpeed: number, aqi: number) => {
          const tips = [];
          if (temp >= 32) tips.push("Stay hydrated and avoid prolonged sun exposure.");
          if (['Rain', 'Thunderstorm', 'Drizzle'].includes(condition)) tips.push("Keep umbrellas or rain gear handy due to rain.");
          if (condition === 'Clear' && temp > 28) tips.push("Apply sunscreen if spending time outdoors.");
          if (windSpeed > 20) tips.push("Secure loose outdoor items due to strong winds.");
          if (aqi >= 4) tips.push("Air quality is poor, limit outdoor activities.");
          if (tips.length === 0) tips.push("Enjoy the pleasant weather!");
          tips.push("Monitor official PAGASA updates for sudden changes.");
          return tips.slice(0, 3);
        };

        setWeather({
          current: {
            temp: `${Math.round(current.main.temp)}°C`,
            condition: current.weather[0].main,
            heatIndex: `${Math.round(current.main.feels_like)}°C`,
            humidity: `${current.main.humidity}%`,
            wind: `${Math.round(current.wind.speed * 3.6)} km/h`,
            airQuality: getAirQualityLabel(airQualityIndex),
            sunrise: new Date(current.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(current.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          hourly: forecastList.slice(0, 7).map((item: any) => ({
            time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric' }),
            icon: getWeatherIcon(item.weather[0].main),
            temp: `${Math.round(item.main.temp)}°C`
          })),
          forecast: forecastList
            .filter((_: any, i: number) => i % 8 === 0) // Approx every 24h
            .map((item: any) => ({
              day: new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short' }),
              icon: getWeatherIcon(item.weather[0].main),
              temp: `${Math.round(item.main.temp)}°C`
            })),
          tips: generateTips(current.weather[0].main, current.main.temp, current.wind.speed * 3.6, airQualityIndex)
        });
      } catch (error) {
        console.error("Weather fetch failed:", error);
        setError("Unable to fetch weather data.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  // Carousel effect for alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % weather.tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [weather.tips.length]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      
      <main className="flex-grow">
        <div className="min-h-screen bg-slate-50">
          <div className="bg-gradient-to-br from-blue-600 to-blue-400 text-white p-8 pb-32 relative overflow-hidden">
            <CloudRain size={200} className="absolute -right-20 -top-20 opacity-20"/>
            <div className="container relative z-10 mx-auto px-4 animate-fade-in sm:px-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
                <div>
                  <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold">
                    <MapPin size={12}/> Mambog II, Bacoor, Cavite
                  </div>
                  {loading ? (
                    <div className="h-32 flex items-center"><Loader2 className="animate-spin h-10 w-10 text-white/50" /></div>
                  ) : (
                    <>
                      <h1 className="mb-2 text-4xl font-bold tracking-tighter sm:text-6xl">{weather.current.temp}</h1>
                      <p className="text-2xl font-medium opacity-90">{weather.current.condition}</p>
                      <p className="text-sm text-blue-100 mt-2">Feels like {weather.current.heatIndex}</p>
                    </>
                  )}
                </div>
                <div className="text-right mt-8 md:mt-0 space-y-1">
                   <div className="text-sm font-bold opacity-80">Last Updated: Now</div>
                   <div className="text-xs opacity-60">Source: OpenWeatherMap</div>
                </div>
              </div>
            </div>
          </div>

          <div className="container relative z-20 mx-auto -mt-24 px-4 sm:px-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Droplet, label: 'Humidity', value: weather.current.humidity },
                { icon: Wind, label: 'Wind', value: weather.current.wind },
                { icon: Cloud, label: 'Air Quality', value: weather.current.airQuality },
                { icon: Thermometer, label: 'Heat Index', value: weather.current.heatIndex },
              ].map((m, i) => (
                <Reveal>
                  <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3">
                     <div className="bg-blue-50 text-blue-600 p-2 rounded-full"><m.icon size={20}/></div>
                     <div>
                       <div className="text-xs text-gray-500 uppercase font-bold">{m.label}</div>
                       <div className="font-bold text-gray-800">{m.value}</div>
                     </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              
              {/* Left Column Group (Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                  
                  {/* Row 1: Weather Alert & Safety Tips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Reveal>
                      {/* Weather Alert UI Card */}
                      <div className="bg-white rounded-[24px] shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="bg-[#2A364E] p-6 rounded-t-[24px] rounded-b-[24px] relative flex-grow">
                          <div className="absolute top-6 right-6 bg-[#DC2626] text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wider">
                            ALERT
                          </div>
                          <h3 className="text-white font-bold text-2xl mb-2">Weather Alert</h3>
                          <p className="text-blue-100 text-sm leading-relaxed">
                            {weather.tips[currentAlertIndex] || "No active weather alerts at this time."}
                          </p>
                        </div>
                        <div className="bg-white p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-[#E0E7FF] p-1.5 rounded-full text-[#1e3a8a]">
                              <Info size={16} />
                            </div>
                            <span className="text-[#1e3a8a] font-semibold text-xs">View PAGASA Forecast</span>
                          </div>
                          <ChevronRight className="text-[#1e3a8a]" size={16} />
                        </div>
                      </div>
                    </Reveal>

                    <Reveal>
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-xl h-full">
                        <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-2"><AlertTriangle size={18}/> Weather Safety Tips</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-orange-900">
                         {weather.tips.map((tip, i) => (
                           <li key={i}>{tip}</li>
                         ))}
                        </ul>
                      </div>
                    </Reveal>
                  </div>

                  {/* Row 2: Hourly Forecast (Moved here) */}
                  <Reveal>
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                      <h3 className="font-bold text-gray-700 mb-6 border-b pb-2">3-Hour Forecast</h3>
                      {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-500" /></div>
                      ) : error ? (
                        <div className="text-center text-red-500 py-4">{error}</div>
                      ) : (
                        <div className="flex overflow-x-auto pb-4 gap-8 no-scrollbar">
                          {weather.hourly.map((h, i) => (
                            <div key={i} className="text-center min-w-[60px] flex-shrink-0">
                              <p className="text-sm text-gray-500 mb-2">{h.time}</p>
                              <h.icon className="mx-auto text-[#638ECB] mb-2" size={24}/>
                              <p className="font-bold text-gray-800">{h.temp}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Reveal>
                  
                  {/* Row 3: Sun & Moon */}
                  <Reveal>
                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-[#395886] mb-4">Sun & Moon</h3>
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           <Sun className="text-orange-400" size={32}/>
                           <div>
                             <div className="text-xs text-gray-500 uppercase">Sunrise</div>
                             <div className="font-bold">{weather.current.sunrise}</div>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="bg-slate-800 rounded-full p-1"><div className="w-6 h-6 bg-slate-200 rounded-full"></div></div>
                           <div>
                             <div className="text-xs text-gray-500 uppercase">Sunset</div>
                             <div className="font-bold">{weather.current.sunset}</div>
                           </div>
                         </div>
                      </div>
                    </div>
                  </Reveal>
              </div>

              {/* Right Column Group (Span 1) - 5 Day Forecast */}
              <div className="lg:col-span-1">
                <Reveal>
                  <div className="bg-white rounded-2xl shadow-sm p-6 h-full">
                    <h3 className="font-bold text-gray-800 mb-4">5-Day Forecast</h3>
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : (
                      <div className="space-y-6">
                        {weather.forecast.map((d, i) => (
                          <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <d.icon size={24} className="text-gray-400"/>
                              <span className="text-gray-500 font-medium">{d.day}</span>
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{d.temp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Reveal>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
            <Chatbot />

    </div>
  );
}
