'use client'

import { useEffect, useState } from 'react'

const UROMI_LAT = 6.7092
const UROMI_LON = 6.3304

function weatherLabel(code: number) {
  if (code === 0) return 'Clear'
  if ([1, 2, 3].includes(code)) return 'Partly cloudy'
  if ([45, 48].includes(code)) return 'Foggy'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain'
  if ([71, 73, 75, 77].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Showers'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Current conditions'
}

export default function GuestDateWeather() {
  const [date, setDate] = useState<Date | null>(null)
  const [weather, setWeather] = useState<{ temperature: number; code: number } | null>(null)

  useEffect(() => {
    const updateDate = () => setDate(new Date())
    updateDate()
    const timer = window.setInterval(updateDate, 60_000)

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${UROMI_LAT}&longitude=${UROMI_LON}&current=temperature_2m,weather_code&temperature_unit=celsius`)
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data?.current) setWeather({ temperature: Math.round(data.current.temperature_2m), code: data.current.weather_code })
      })
      .catch(() => undefined)

    return () => window.clearInterval(timer)
  }, [])

  const formattedDate = date?.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  })

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gold-500/20 pb-2.5 mb-4 md:mb-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
        <p className="truncate text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-500">
          {formattedDate || 'Loading date...'}
        </p>
      </div>
      <p className="shrink-0 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-navy-400">
        Uromi • {weather ? `${weather.temperature}°C ${weatherLabel(weather.code)}` : 'Weather loading'}
      </p>
    </div>
  )
}
