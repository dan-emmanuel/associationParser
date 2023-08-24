export interface SubventionTable {
  type_projet:       TypeProjet[];
  _id:               string;
  code:              number;
  libelle:           string;
  dispositif:        Dispositif;
  campagne_exercice: string;
  instructeurs:      Instructeur[];
}

export interface Dispositif {
  sous_dispositifs:  SousDispositif[];
  enabled:           boolean;
  _id:               ID;
  nom:               string;
  numero_programme?: string;
  code:              Code;
  updatedAt:         string;
  createdAt?:        string;
  created_at?:       string;
}

export enum ID {
  The5B87Fa2C4D2E406A69F368D0 = "5b87fa2c4d2e406a69f368d0",
  The5B87Fa2C4D2E406A69F368D1 = "5b87fa2c4d2e406a69f368d1",
  The5B87Fa2C4D2E406A69F368D2 = "5b87fa2c4d2e406a69f368d2",
  The5B87Fa2C4D2E406A69F368D3 = "5b87fa2c4d2e406a69f368d3",
  The5C6D7088D3862D2E76E17230 = "5c6d7088d3862d2e76e17230",
  The5E5E33484C30A06Ace1D326C = "5e5e33484c30a06ace1d326c",
  The60391F3D26Af1032F61Ed95C = "60391f3d26af1032f61ed95c",
  The60Db1941654Bf93697Bfed5C = "60db1941654bf93697bfed5c",
  The60Ddba7C654Bf93697Bfed5F = "60ddba7c654bf93697bfed5f",
  The617Ea570E06A6D7Af02Bc265 = "617ea570e06a6d7af02bc265",
  The623499316A518825A8646F02 = "623499316a518825a8646f02",
  The6262Aa9A6A518825A8646F68 = "6262aa9a6a518825a8646f68",
  The629E13E8783B0D25Affaa131 = "629e13e8783b0d25affaa131",
  The635Be71Ba407E627F92Adfe2 = "635be71ba407e627f92adfe2",
}

export enum Code {
  Asc = "ASC",
  Cnds = "CNDS",
  EnseignementScolaire = "enseignement-scolaire",
  Fdva = "FDVA",
  Fede = "FEDE",
  Fonjep = "fonjep",
  Mentorat = "mentorat",
  MesriEgaliteLutteVss = "mesri-egalite-lutte-vss",
  PartenariatAssociatif = "Partenariat associatif",
  PartenariatJEP = "Partenariat JEP",
  PassSport = "pass-sport",
  ProtectionDeLEnvironnement = "Protection de l'environnement",
  ScienceSociété = "Science-Société",
  The2HSportCollege = "2h-sport-college",
}

export interface SousDispositif {
  enabled:    boolean;
  _id:        string;
  code:       string;
  nom:        string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Instructeur {
  isReferent: boolean;
  contact:    Contact;
  service:    Service;
}

export interface Contact {
  telephone?: string;
  email?:     string;
  nom?:       string;
}

export interface Service {
  dispositifs:          Dispositif[];
  enabled:              boolean;
  _id:                  string;
  code:                 string;
  nom:                  string;
  type:                 Type;
  niveau_territorial:   NiveauTerritorial;
  zone_territoriale:    ZoneTerritoriale;
  profil:               Profil;
  adresse?:             string;
  site_internet?:       string;
  email?:               Email;
  __v?:                 number;
  parent?:              null | string;
  authId:               string;
  bo:                   Bo;
  code_territoire?:     null | string;
  siret?:               string;
  federation_sportive?: number;
  siren?:               string;
}

export interface Bo {
  enabled: boolean;
  _id:     IDEnum;
  nom:     Nom;
  url:     string;
  id:      IDEnum;
}

export enum IDEnum {
  The5Ce56061F9E00916Ea50Be21 = "5ce56061f9e00916ea50be21",
}

export enum Nom {
  Osiris = "osiris",
}

export enum Email {
  DjepvaSd1BJeunesseSportsGouvFr = "djepva.sd1b@jeunesse-sports.gouv.fr",
  DrdjscsPacaVieAssociativeJscsGouvFr = "drdjscs-paca-vie-associative@jscs.gouv.fr",
  Empty = "",
}

export enum NiveauTerritorial {
  Départemental = "départemental",
  National = "national",
  Régional = "régional",
}

export enum Profil {
  AdministrateurLocal = "Administrateur local",
  AdministrateurNational = "Administrateur national",
}

export enum Type {
  Creps = "CREPS",
  Etat = "Etat",
  FédérationsSportives = "Fédérations sportives",
}

export enum ZoneTerritoriale {
  AgenceDuSport = "Agence du Sport",
  AlpesMaritimes = "Alpes-Maritimes",
  France = "France",
  ProvenceAlpesCôteDAzur = "Provence-Alpes-Côte d'Azur",
}

export enum TypeProjet {
  Action = "Action",
  Fonctionnement = "Fonctionnement",
}
