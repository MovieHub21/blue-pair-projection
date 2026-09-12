
'use client'

import { useEffect, useState } from 'react'

export default function LiveDateTime() {
  const [dateTime, setDateTime] = useState<Date | null>(null)

  useEffect(() => {
    const update = () => setDateTime(new Date())

    update()

    const timer = setInterval(update, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!dateTime) {
    return <span className="eyebrow">Loading...</span>
  }

  const formattedDate = dateTime.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  })

  const formattedTime = dateTime.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  })

  return (
    <span className="eyebrow">
      {formattedDate} • {formattedTime}
    </span>
  )
}

