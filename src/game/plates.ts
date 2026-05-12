export type Unit = 'lb' | 'kg'

export type Plate = {
  weight: number
  unit: Unit
  color: string
  ring: string
  label: string
  diameter: number
  thickness: number
}

export type Bar = {
  weight: number
  unit: Unit
  label: string
  length: number
  thickness: number
}

const LB: Record<number, Omit<Plate, 'unit' | 'weight'>> = {
  45:   { color: '#D94B3E', ring: '#A8362C', label: '45',   diameter: 1.00, thickness: 1.00 },
  35:   { color: '#3C68C8', ring: '#284B9A', label: '35',   diameter: 0.94, thickness: 0.90 },
  25:   { color: '#36A559', ring: '#256E3D', label: '25',   diameter: 0.86, thickness: 0.78 },
  10:   { color: '#F2EEDF', ring: '#C9C2A8', label: '10',   diameter: 0.72, thickness: 0.62 },
  5:    { color: '#2A2A2E', ring: '#0F0F12', label: '5',    diameter: 0.60, thickness: 0.50 },
  2.5:  { color: '#2A2A2E', ring: '#0F0F12', label: '2½',   diameter: 0.50, thickness: 0.40 },
  1.25: { color: '#C8C5BB', ring: '#8E8B82', label: '1¼',   diameter: 0.44, thickness: 0.34 },
}

const KG: Record<number, Omit<Plate, 'unit' | 'weight'>> = {
  25:   { color: '#D94B3E', ring: '#A8362C', label: '25',   diameter: 0.95, thickness: 1.00 },
  20:   { color: '#3C68C8', ring: '#284B9A', label: '20',   diameter: 0.92, thickness: 0.92 },
  15:   { color: '#E8C642', ring: '#B0942C', label: '15',   diameter: 0.86, thickness: 0.82 },
  10:   { color: '#36A559', ring: '#256E3D', label: '10',   diameter: 0.78, thickness: 0.70 },
  5:    { color: '#F2EEDF', ring: '#C9C2A8', label: '5',    diameter: 0.66, thickness: 0.56 },
  2.5:  { color: '#2A2A2E', ring: '#0F0F12', label: '2½',   diameter: 0.54, thickness: 0.44 },
  1.25: { color: '#C8C5BB', ring: '#8E8B82', label: '1¼',   diameter: 0.46, thickness: 0.36 },
  0.5:  { color: '#3C68C8', ring: '#284B9A', label: '½',    diameter: 0.40, thickness: 0.30 },
  0.25: { color: '#36A559', ring: '#256E3D', label: '¼',    diameter: 0.36, thickness: 0.26 },
}

export function plate(weight: number, unit: Unit): Plate {
  const src = unit === 'lb' ? LB[weight] : KG[weight]
  if (!src) throw new Error(`unknown ${unit} plate: ${weight}`)
  return { ...src, weight, unit }
}

export const BARS: Record<string, Bar> = {
  'lb-45': { weight: 45, unit: 'lb', label: '45 lb Olympic',   length: 1.00, thickness: 1.00 },
  'lb-35': { weight: 35, unit: 'lb', label: '35 lb Women\'s',  length: 0.94, thickness: 0.92 },
  'lb-25': { weight: 25, unit: 'lb', label: '25 lb Technique', length: 0.86, thickness: 0.80 },
  'lb-15': { weight: 15, unit: 'lb', label: '15 lb Training',  length: 0.80, thickness: 0.72 },
  'kg-20': { weight: 20, unit: 'kg', label: '20 kg Olympic',   length: 1.00, thickness: 1.00 },
  'kg-15': { weight: 15, unit: 'kg', label: '15 kg Women\'s',  length: 0.94, thickness: 0.92 },
  'kg-10': { weight: 10, unit: 'kg', label: '10 kg Technique', length: 0.86, thickness: 0.80 },
}

export const LB_SIZES = [45, 35, 25, 10, 5, 2.5, 1.25] as const
export const KG_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25] as const
