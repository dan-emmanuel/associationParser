
export interface PubfundingMetadata {
  projet:                Projet;
  type_projet:           string[];
  deleted:               boolean;
  _id:                   string;
  code:                  number;
  active:                boolean;
  back_office?:          string;
  libelle:               string;
  dispositif:            Dispositif;
  campagne_exercice:     string;
  description?:          null | string;
  references?:           null | string;
  criteres_eligibilite?: null | string;
  champs_attendus:       ChampsAttendus[];
  documents_attendus:    DocumentsAttendus[];
  __v:                   number;
  sous_dispositifs:      sous_dispositifs[];
  instructeurs:          Instructeur[];
}

export interface ChampsAttendus {
  enabled?:    boolean;
  code:        string;
  label:       string;
  part:        string;
  type:        string;
  options?:    OptionsClass | string;
  asks:        ChampsAttendusAsk[];
  position:    number;
  labelCode:   string;
  validation?: ValidationClass | string;
  default:     Default[];
}

export interface ChampsAttendusAsk {
  scope:     string;
  key:       string;
  operator?: string;
  value:     string[] | string;
}

export interface Default {
  asks:     DefaultAsk[];
  editable: boolean;
  value:    boolean | ValueClass | string;
}

export interface DefaultAsk {
  scope:     string;
  key:       string;
  value:     string;
  operator?: string;
}

export interface ValueClass {
  scope: string;
  key:   string;
}

export interface OptionsClass {
  referentiel?: string;
  scope?:       string;
  key?:         string;
  label?:       string;
  value?:       string;
  filters?:     PurpleFilter[];
  depedencies?: DepedencyElement[];
}

export interface DepedencyElement {
  key:   string;
  value: string;
}

export interface PurpleFilter {
  key:      string;
  operator: string;
}

export interface ValidationClass {
  required: boolean | RequiredClass;
  regex?:   string;
}

export interface RequiredClass {
  allowFalse: boolean;
}

export interface Dispositif {
  sous_dispositifs:  DispositifSousDispositif[];
  enabled:           boolean;
  _id:               string;
  nom:               string;
  numero_programme?: string;
  code:              string;
  updatedAt:         string;
  createdAt?:        string;
  created_at?:       string;
}

export interface DispositifSousDispositif {
  enabled:    boolean;
  _id:        string;
  code:       string;
  nom:        string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentsAttendus {
  code:       string;
  nature?:    string;
  asks:       DocumentsAttendusAsk[];
  filters:    DepedencyElement[];
  compulsory: boolean;
  label?:     string;
  dest?:      string;
}

export interface DocumentsAttendusAsk {
  scope:     string;
  key?:      string;
  operator?: string;
  value?:    string[] | string;
  scope2?:   string;
  key2?:     string;
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
  type:                 string;
  niveau_territorial:   string;
  zone_territoriale:    string;
  profil:               string;
  adresse?:             string;
  site_internet?:       string;
  email?:               string;
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
  _id:     string;
  nom:     string;
  url:     string;
  id:      string;
}

export interface Projet {
  autopopulate: boolean;
}

export interface sous_dispositifs {
  actif:       boolean;
  nom?:        string;
  date_debut?: null | string;
  date_fin?:   null | string;
  code:        string;
}

