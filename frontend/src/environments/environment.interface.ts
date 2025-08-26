export interface Environment {
  production: boolean;
  apiUrl: string;
  name: string;
  contact: {
    email: string;
    address: string;
    businessHours: string;
  };
  business: {
    name: string;
    tagline: string;
    description: string;
    founded: string;
    specialties: string[];
  };
}