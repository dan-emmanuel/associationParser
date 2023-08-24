export interface LoginData {
  roles:              string[];
  enabled:            boolean;
  mustChangePassword: boolean;
  _id:                string;
  email:              string;
  civilite:           string;
  nom:                string;
  prenom:             string;
  externalized:       Externalized;
  updatedAt:          string;
  token:              string;
  refreshToken:       string;
}

export interface Externalized {
  idNir: string;
}