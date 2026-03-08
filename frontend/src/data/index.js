export const toolCards = [
  {
    icon: 'Scan',
    title: 'Room Analyzer',
    description: 'Upload or capture your room to get instant AI analysis',
    link: '/analyze',
  },
  {
    icon: 'Sparkles',
    title: 'Style Suggester',
    description: 'Get personalized design recommendations based on your preferences',
    link: '/design-style?style=Modern',
  },
  {
    icon: 'Box',
    title: '3D Visualization',
    description: 'View your designs in immersive 3D before making decisions',
    link: '/studio?tool=3d',
  },
  {
    icon: 'Maximize2',
    title: 'Furniture Optimizer',
    description: 'Smart layout suggestions to maximize space efficiency',
    link: '/studio?tool=optimizer',
  },
  {
    icon: 'DollarSign',
    title: 'Budget Planner',
    description: 'Plan and track your interior design budget effortlessly',
    link: '/studio?tool=budget',
  },
  {
    icon: 'Camera',
    title: 'Live AR Camera',
    description: 'See furniture in your space with augmented reality',
    link: '/studio?tool=ar',
  },
]

export const designStyles = [
  {
    name: 'Modern Minimalist',
    image:
      'https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    name: 'Scandinavian',
    image:
      'https://images.unsplash.com/photo-1600494448655-ae58f58bb945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    name: 'Industrial',
    image:
      'https://images.unsplash.com/photo-1768413292179-d958b344f1d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    name: 'Bohemian',
    image:
      'https://images.unsplash.com/photo-1600493504591-aa1849716b36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    name: 'Contemporary',
    image:
      'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
  {
    name: 'Mid-Century Modern',
    image:
      'https://images.unsplash.com/photo-1673695008224-fa5a9d195dfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80',
  },
]

export const furnitureItems = [
  { name: 'Sofa', icon: 'Sofa', status: 'High', price: '$1,200', color: '#7C3AED' },
  { name: 'Loveseat', icon: 'Sofa', status: 'Medium', price: '$850', color: '#3B82F6' },
  { name: 'Armchair', icon: 'Armchair', status: 'Popular', price: '$450', color: '#22C55E' },
  { name: 'Coffee Table', icon: 'Coffee', status: 'High', price: '$320', color: '#7C3AED' },
  { name: 'TV Stand', icon: 'Monitor', status: 'Medium', price: '$280', color: '#3B82F6' },
  { name: 'Table Lamp', icon: 'Lamp', status: 'Popular', price: '$95', color: '#22C55E' },
]

export const budgetCategories = [
  { name: 'Furniture', percentage: 45, amount: 4500, color: '#7C3AED' },
  { name: 'Decor & Accessories', percentage: 20, amount: 2000, color: '#3B82F6' },
  { name: 'Lighting', percentage: 15, amount: 1500, color: '#22C55E' },
  { name: 'Paint & Wallpaper', percentage: 12, amount: 1200, color: '#F59E0B' },
  { name: 'Installation & Labor', percentage: 8, amount: 800, color: '#EF4444' },
]

export const mockDesigns = [
  {
    id: '1',
    roomName: 'Modern Living Room',
    style: 'Modern',
    budget: 12000,
    roomType: 'Living Room',
    createdDate: '2026-03-01',
    image:
      'https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    id: '2',
    roomName: 'Scandinavian Bedroom',
    style: 'Scandinavian',
    budget: 8500,
    roomType: 'Bedroom',
    createdDate: '2026-02-28',
    image:
      'https://images.unsplash.com/photo-1600494448655-ae58f58bb945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    id: '3',
    roomName: 'Industrial Kitchen',
    style: 'Industrial',
    budget: 15000,
    roomType: 'Kitchen',
    createdDate: '2026-02-25',
    image:
      'https://images.unsplash.com/photo-1768413292179-d958b344f1d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    id: '4',
    roomName: 'Bohemian Office',
    style: 'Bohemian',
    budget: 6000,
    roomType: 'Office',
    createdDate: '2026-02-20',
    image:
      'https://images.unsplash.com/photo-1741119245420-1b6f80a49c42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    id: '5',
    roomName: 'Contemporary Dining',
    style: 'Contemporary',
    budget: 10000,
    roomType: 'Dining Room',
    createdDate: '2026-02-15',
    image:
      'https://images.unsplash.com/photo-1685644201646-9e836c398c92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
  {
    id: '6',
    roomName: 'Traditional Bathroom',
    style: 'Traditional',
    budget: 7500,
    roomType: 'Bathroom',
    createdDate: '2026-02-10',
    image:
      'https://images.unsplash.com/photo-1764551322786-54a994923d8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
  },
]

export const styleOptions = ['Modern', 'Scandinavian', 'Industrial', 'Bohemian', 'Contemporary', 'Traditional']
export const roomTypes = ['Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Bathroom']




