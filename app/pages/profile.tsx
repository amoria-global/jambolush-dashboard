"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaCalendarPlus,
  FaEdit,
  FaShieldAlt,
  FaUserCircle,
  FaKey,
  FaTrash,
  FaCamera,
  FaUpload,
  FaCheck,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPencilAlt,
  FaExclamationTriangle,
  FaSearch
} from 'react-icons/fa';

// --- INTERFACES ---

interface UserInfo {
  id: number;
  profile: string;
  name: string;
  email: string;
  status?: string;
  userType?: string;
  phone?: string;
  phoneCountryCode?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_sessions?: number;

  // Dynamic Address Fields
  street?: string;
  city?: string;
  state?: string;
  province?: string;
  district?: string;
  zipCode?: string;
  postalCode?: string;
  postcode?: string;
  pinCode?: string;
  cep?: string;
  county?: string;
  region?: string;
  prefecture?: string;
  village?: string;
  island?: string;
  parish?: string;
  blockNumber?: string;
  dzongkhag?: string;
  department?: string;
  atoll?: string;
  'flat/floor/block'?: string;
  buildingName?: string;
  eircode?: string;
  town?: string;
  building?: string;
  governorate?: string;
  'oblast/krai/republic'?: string;
  quarter?: string;
  zone?: string;
  'sub-district'?: string;
  suco?: string;
  administrativePost?: string;
  municipality?: string;
  ward?: string;
  township?: string;
  'state/region'?: string;
  hamlet?: string;
  suburb?: string;
  emirate?: string;
  kingdom?: string;
}


interface CountryInfo {
  name: string;
  flag: string;
  code: string;
  addressFields: string[];
  states?: string[];
  provinces?: string[];
}

// --- COUNTRY DATA (ALL COUNTRIES) ---

const countryData: Record<string, CountryInfo> = {
    // --- PREVIOUSLY DEFINED COUNTRIES WITH SPECIFIC FIELDS ---
    US: { name: 'United States', flag: '🇺🇸', code: '+1', addressFields: ['street', 'city', 'state', 'zipCode'], states: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'] },
    CA: { name: 'Canada', flag: '🇨🇦', code: '+1', addressFields: ['street', 'city', 'province', 'postalCode'], provinces: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'] },
    GB: { name: 'United Kingdom', flag: '🇬🇧', code: '+44', addressFields: ['street', 'city', 'county', 'postcode'] },
    FR: { name: 'France', flag: '🇫🇷', code: '+33', addressFields: ['street', 'city', 'region', 'postalCode'] },
    DE: { name: 'Germany', flag: '🇩🇪', code: '+49', addressFields: ['street', 'city', 'state', 'postalCode'] },
    IN: { name: 'India', flag: '🇮🇳', code: '+91', addressFields: ['street', 'city', 'state', 'district', 'pinCode'], states: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'] },
    AU: { name: 'Australia', flag: '🇦🇺', code: '+61', addressFields: ['street', 'city', 'state', 'postcode'], states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'] },
    JP: { name: 'Japan', flag: '🇯🇵', code: '+81', addressFields: ['street', 'city', 'prefecture', 'postalCode'] },
    CN: { name: 'China', flag: '🇨🇳', code: '+86', addressFields: ['street', 'district', 'city', 'province', 'postalCode'] },
    BR: { name: 'Brazil', flag: '🇧🇷', code: '+55', addressFields: ['street', 'city', 'state', 'cep'] },
    MX: { name: 'Mexico', flag: '🇲🇽', code: '+52', addressFields: ['street', 'city', 'state', 'postalCode'] },
    RW: { name: 'Rwanda', flag: '🇷🇼', code: '+250', addressFields: ['street', 'district', 'province', 'city'], provinces: ['Kigali City', 'Eastern Province', 'Northern Province', 'Southern Province', 'Western Province'] },
    KE: { name: 'Kenya', flag: '🇰🇪', code: '+254', addressFields: ['street', 'city', 'county', 'postalCode'] },
    NG: { name: 'Nigeria', flag: '🇳🇬', code: '+234', addressFields: ['street', 'city', 'state', 'postalCode'], states: ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'] },
    ZA: { name: 'South Africa', flag: '🇿🇦', code: '+27', addressFields: ['street', 'city', 'province', 'postalCode'], provinces: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'] },
    // --- EXPANDED LIST OF ALL COUNTRIES (GENERIC ADDRESS FIELDS) ---
    AF: { name: 'Afghanistan', flag: '🇦🇫', code: '+93', addressFields: ['street', 'city', 'province', 'postalCode'] },
    AL: { name: 'Albania', flag: '🇦🇱', code: '+355', addressFields: ['street', 'city', 'postalCode'] },
    DZ: { name: 'Algeria', flag: '🇩🇿', code: '+213', addressFields: ['street', 'city', 'province', 'postalCode'] },
    AS: { name: 'American Samoa', flag: '🇦🇸', code: '+1-684', addressFields: ['street', 'village', 'island', 'zipCode'] },
    AD: { name: 'Andorra', flag: '🇦🇩', code: '+376', addressFields: ['street', 'parish', 'postalCode'] },
    AO: { name: 'Angola', flag: '🇦🇴', code: '+244', addressFields: ['street', 'city', 'province'] },
    AI: { name: 'Anguilla', flag: '🇦🇮', code: '+1-264', addressFields: ['street', 'district', 'postCode'] },
    AG: { name: 'Antigua and Barbuda', flag: '🇦🇬', code: '+1-268', addressFields: ['street', 'city', 'parish'] },
    AR: { name: 'Argentina', flag: '🇦🇷', code: '+54', addressFields: ['street', 'city', 'province', 'postalCode'] },
    AM: { name: 'Armenia', flag: '🇦🇲', code: '+374', addressFields: ['street', 'city', 'province', 'postalCode'] },
    AW: { name: 'Aruba', flag: '🇦🇼', code: '+297', addressFields: ['street', 'city', 'region'] },
    AT: { name: 'Austria', flag: '🇦🇹', code: '+43', addressFields: ['street', 'city', 'postalCode'] },
    AZ: { name: 'Azerbaijan', flag: '🇦🇿', code: '+994', addressFields: ['street', 'city', 'postalCode'] },
    BS: { name: 'Bahamas', flag: '🇧🇸', code: '+1-242', addressFields: ['street', 'island', 'city'] },
    BH: { name: 'Bahrain', flag: '🇧🇭', code: '+973', addressFields: ['street', 'city', 'blockNumber', 'postalCode'] },
    BD: { name: 'Bangladesh', flag: '🇧🇩', code: '+880', addressFields: ['street', 'city', 'district', 'postalCode'] },
    BB: { name: 'Barbados', flag: '🇧🇧', code: '+1-246', addressFields: ['street', 'parish'] },
    BY: { name: 'Belarus', flag: '🇧🇾', code: '+375', addressFields: ['street', 'city', 'region', 'postalCode'] },
    BE: { name: 'Belgium', flag: '🇧🇪', code: '+32', addressFields: ['street', 'city', 'postalCode'] },
    BZ: { name: 'Belize', flag: '🇧🇿', code: '+501', addressFields: ['street', 'city', 'district'] },
    BJ: { name: 'Benin', flag: '🇧🇯', code: '+229', addressFields: ['street', 'city', 'department'] },
    BM: { name: 'Bermuda', flag: '🇧🇲', code: '+1-441', addressFields: ['street', 'parish', 'postalCode'] },
    BT: { name: 'Bhutan', flag: '🇧🇹', code: '+975', addressFields: ['street', 'city', 'dzongkhag', 'postalCode'] },
    BO: { name: 'Bolivia', flag: '🇧🇴', code: '+591', addressFields: ['street', 'city', 'department'] },
    BA: { name: 'Bosnia and Herzegovina', flag: '🇧🇦', code: '+387', addressFields: ['street', 'city', 'postalCode'] },
    BW: { name: 'Botswana', flag: '🇧🇼', code: '+267', addressFields: ['street', 'city', 'district'] },
    IO: { name: 'British Indian Ocean Territory', flag: '🇮🇴', code: '+246', addressFields: [] },
    BN: { name: 'Brunei Darussalam', flag: '🇧🇳', code: '+673', addressFields: ['street', 'city', 'district', 'postalCode'] },
    BG: { name: 'Bulgaria', flag: '🇧🇬', code: '+359', addressFields: ['street', 'city', 'province', 'postalCode'] },
    BF: { name: 'Burkina Faso', flag: '🇧🇫', code: '+226', addressFields: ['street', 'city', 'province'] },
    BI: { name: 'Burundi', flag: '🇧🇮', code: '+257', addressFields: ['street', 'city', 'province'] },
    KH: { name: 'Cambodia', flag: '🇰🇭', code: '+855', addressFields: ['street', 'city', 'province', 'postalCode'] },
    CM: { name: 'Cameroon', flag: '🇨🇲', code: '+237', addressFields: ['street', 'city', 'region'] },
    CV: { name: 'Cape Verde', flag: '🇨🇻', code: '+238', addressFields: ['street', 'city', 'island', 'postalCode'] },
    KY: { name: 'Cayman Islands', flag: '🇰🇾', code: '+1-345', addressFields: ['street', 'island', 'postalCode'] },
    CF: { name: 'Central African Republic', flag: '🇨🇫', code: '+236', addressFields: ['street', 'city', 'prefecture'] },
    TD: { name: 'Chad', flag: '🇹🇩', code: '+235', addressFields: ['street', 'city', 'region'] },
    CL: { name: 'Chile', flag: '🇨🇱', code: '+56', addressFields: ['street', 'city', 'region', 'postalCode'] },
    CX: { name: 'Christmas Island', flag: '🇨🇽', code: '+61', addressFields: ['street', 'postalCode'] },
    CC: { name: 'Cocos (Keeling) Islands', flag: '🇨🇨', code: '+61', addressFields: ['street', 'atoll', 'postalCode'] },
    CO: { name: 'Colombia', flag: '🇨🇴', code: '+57', addressFields: ['street', 'city', 'department', 'postalCode'] },
    KM: { name: 'Comoros', flag: '🇰🇲', code: '+269', addressFields: ['street', 'city', 'island'] },
    CG: { name: 'Congo', flag: '🇨🇬', code: '+242', addressFields: ['street', 'city', 'department'] },
    CD: { name: 'Congo, Democratic Republic of the', flag: '🇨🇩', code: '+243', addressFields: ['street', 'city', 'province'] },
    CK: { name: 'Cook Islands', flag: '🇨🇰', code: '+682', addressFields: ['street', 'village', 'island'] },
    CR: { name: 'Costa Rica', flag: '🇨🇷', code: '+506', addressFields: ['street', 'city', 'province', 'postalCode'] },
    HR: { name: 'Croatia', flag: '🇭🇷', code: '+385', addressFields: ['street', 'city', 'county', 'postalCode'] },
    CU: { name: 'Cuba', flag: '🇨🇺', code: '+53', addressFields: ['street', 'city', 'province', 'postalCode'] },
    CW: { name: 'Curaçao', flag: '🇨🇼', code: '+599', addressFields: ['street', 'city'] },
    CY: { name: 'Cyprus', flag: '🇨🇾', code: '+357', addressFields: ['street', 'city', 'district', 'postalCode'] },
    CZ: { name: 'Czech Republic', flag: '🇨🇿', code: '+420', addressFields: ['street', 'city', 'postalCode'] },
    DK: { name: 'Denmark', flag: '🇩🇰', code: '+45', addressFields: ['street', 'city', 'postalCode'] },
    DJ: { name: 'Djibouti', flag: '🇩🇯', code: '+253', addressFields: ['street', 'city', 'region'] },
    DM: { name: 'Dominica', flag: '🇩🇲', code: '+1-767', addressFields: ['street', 'parish'] },
    DO: { name: 'Dominican Republic', flag: '🇩🇴', code: '+1-809', addressFields: ['street', 'city', 'province', 'postalCode'] },
    EC: { name: 'Ecuador', flag: '🇪🇨', code: '+593', addressFields: ['street', 'city', 'province', 'postalCode'] },
    EG: { name: 'Egypt', flag: '🇪🇬', code: '+20', addressFields: ['street', 'city', 'governorate', 'postalCode'] },
    SV: { name: 'El Salvador', flag: '🇸🇻', code: '+503', addressFields: ['street', 'city', 'department', 'postalCode'] },
    GQ: { name: 'Equatorial Guinea', flag: '🇬🇶', code: '+240', addressFields: ['street', 'city', 'province'] },
    ER: { name: 'Eritrea', flag: '🇪🇷', code: '+291', addressFields: ['street', 'city', 'region'] },
    EE: { name: 'Estonia', flag: '🇪🇪', code: '+372', addressFields: ['street', 'city', 'county', 'postalCode'] },
    ET: { name: 'Ethiopia', flag: '🇪🇹', code: '+251', addressFields: ['street', 'city', 'region', 'postalCode'] },
    FK: { name: 'Falkland Islands (Malvinas)', flag: '🇫🇰', code: '+500', addressFields: ['street', 'postalCode'] },
    FO: { name: 'Faroe Islands', flag: '🇫🇴', code: '+298', addressFields: ['street', 'city', 'postalCode'] },
    FJ: { name: 'Fiji', flag: '🇫🇯', code: '+679', addressFields: ['street', 'city', 'division'] },
    FI: { name: 'Finland', flag: '🇫🇮', code: '+358', addressFields: ['street', 'city', 'postalCode'] },
    GF: { name: 'French Guiana', flag: '🇬🇫', code: '+594', addressFields: ['street', 'city', 'postalCode'] },
    PF: { name: 'French Polynesia', flag: '🇵🇫', code: '+689', addressFields: ['street', 'city', 'island', 'postalCode'] },
    GA: { name: 'Gabon', flag: '🇬🇦', code: '+241', addressFields: ['street', 'city', 'province'] },
    GM: { name: 'Gambia', flag: '🇬🇲', code: '+220', addressFields: ['street', 'city', 'division'] },
    GE: { name: 'Georgia', flag: '🇬🇪', code: '+995', addressFields: ['street', 'city', 'region', 'postalCode'] },
    GH: { name: 'Ghana', flag: '🇬🇭', code: '+233', addressFields: ['street', 'city', 'region', 'postalCode'] },
    GI: { name: 'Gibraltar', flag: '🇬🇮', code: '+350', addressFields: ['street'] },
    GR: { name: 'Greece', flag: '🇬🇷', code: '+30', addressFields: ['street', 'city', 'postalCode'] },
    GL: { name: 'Greenland', flag: '🇬🇱', code: '+299', addressFields: ['street', 'city', 'postalCode'] },
    GD: { name: 'Grenada', flag: '🇬🇩', code: '+1-473', addressFields: ['street', 'parish'] },
    GP: { name: 'Guadeloupe', flag: '🇬🇵', code: '+590', addressFields: ['street', 'city', 'postalCode'] },
    GU: { name: 'Guam', flag: '🇬🇺', code: '+1-671', addressFields: ['street', 'village', 'zipCode'] },
    GT: { name: 'Guatemala', flag: '🇬🇹', code: '+502', addressFields: ['street', 'city', 'department', 'postalCode'] },
    GG: { name: 'Guernsey', flag: '🇬🇬', code: '+44', addressFields: ['street', 'parish', 'postcode'] },
    GN: { name: 'Guinea', flag: '🇬🇳', code: '+224', addressFields: ['street', 'city', 'region'] },
    GW: { name: 'Guinea-Bissau', flag: '🇬🇼', code: '+245', addressFields: ['street', 'city', 'region', 'postalCode'] },
    GY: { name: 'Guyana', flag: '🇬🇾', code: '+592', addressFields: ['street', 'city', 'region'] },
    HT: { name: 'Haiti', flag: '🇭🇹', code: '+509', addressFields: ['street', 'city', 'department', 'postalCode'] },
    VA: { name: 'Holy See (Vatican City State)', flag: '🇻🇦', code: '+379', addressFields: ['street', 'city', 'postalCode'] },
    HN: { name: 'Honduras', flag: '🇭🇳', code: '+504', addressFields: ['street', 'city', 'department', 'postalCode'] },
    HK: { name: 'Hong Kong', flag: '🇭🇰', code: '+852', addressFields: ['flat/floor/block', 'buildingName', 'street', 'district'] },
    HU: { name: 'Hungary', flag: '🇭🇺', code: '+36', addressFields: ['city', 'street', 'postalCode'] },
    IS: { name: 'Iceland', flag: '🇮🇸', code: '+354', addressFields: ['street', 'city', 'postalCode'] },
    ID: { name: 'Indonesia', flag: '🇮🇩', code: '+62', addressFields: ['street', 'city', 'province', 'postalCode'] },
    IR: { name: 'Iran', flag: '🇮🇷', code: '+98', addressFields: ['street', 'city', 'province', 'postalCode'] },
    IQ: { name: 'Iraq', flag: '🇮🇶', code: '+964', addressFields: ['street', 'city', 'governorate', 'postalCode'] },
    IE: { name: 'Ireland', flag: '🇮🇪', code: '+353', addressFields: ['street', 'city', 'county', 'eircode'] },
    IM: { name: 'Isle of Man', flag: '🇮🇲', code: '+44', addressFields: ['street', 'town', 'postcode'] },
    IL: { name: 'Israel', flag: '🇮🇱', code: '+972', addressFields: ['street', 'city', 'postalCode'] },
    IT: { name: 'Italy', flag: '🇮🇹', code: '+39', addressFields: ['street', 'city', 'province', 'postalCode'] },
    CI: { name: 'Ivory Coast', flag: '🇨🇮', code: '+225', addressFields: ['street', 'city', 'region'] },
    JM: { name: 'Jamaica', flag: '🇯🇲', code: '+1-876', addressFields: ['street', 'city', 'parish', 'postalCode'] },
    JE: { name: 'Jersey', flag: '🇯🇪', code: '+44', addressFields: ['street', 'parish', 'postcode'] },
    JO: { name: 'Jordan', flag: '🇯🇴', code: '+962', addressFields: ['street', 'city', 'governorate', 'postalCode'] },
    KZ: { name: 'Kazakhstan', flag: '🇰🇿', code: '+7', addressFields: ['street', 'city', 'region', 'postalCode'] },
    KI: { name: 'Kiribati', flag: '🇰🇮', code: '+686', addressFields: ['street', 'village', 'island'] },
    KP: { name: 'Korea, Democratic People\'s Republic of', flag: '🇰🇵', code: '+850', addressFields: ['street', 'district', 'city', 'province'] },
    KR: { name: 'Korea, Republic of', flag: '🇰🇷', code: '+82', addressFields: ['street', 'city', 'province', 'postalCode'] },
    KW: { name: 'Kuwait', flag: '🇰🇼', code: '+965', addressFields: ['street', 'block', 'city', 'governorate', 'postalCode'] },
    KG: { name: 'Kyrgyzstan', flag: '🇰🇬', code: '+996', addressFields: ['street', 'city', 'region', 'postalCode'] },
    LA: { name: 'Lao People\'s Democratic Republic', flag: '🇱🇦', code: '+856', addressFields: ['street', 'village', 'district', 'province'] },
    LV: { name: 'Latvia', flag: '🇱🇻', code: '+371', addressFields: ['street', 'city', 'postalCode'] },
    LB: { name: 'Lebanon', flag: '🇱🇧', code: '+961', addressFields: ['street', 'city', 'governorate'] },
    LS: { name: 'Lesotho', flag: '🇱🇸', code: '+266', addressFields: ['street', 'city', 'district', 'postalCode'] },
    LR: { name: 'Liberia', flag: '🇱🇷', code: '+231', addressFields: ['street', 'city', 'county', 'postalCode'] },
    LY: { name: 'Libya', flag: '🇱🇾', code: '+218', addressFields: ['street', 'city', 'district'] },
    LI: { name: 'Liechtenstein', flag: '🇱🇮', code: '+423', addressFields: ['street', 'city', 'postalCode'] },
    LT: { name: 'Lithuania', flag: '🇱🇹', code: '+370', addressFields: ['street', 'city', 'postalCode'] },
    LU: { name: 'Luxembourg', flag: '🇱🇺', code: '+352', addressFields: ['street', 'city', 'postalCode'] },
    MO: { name: 'Macao', flag: '🇲🇴', code: '+853', addressFields: ['street', 'building'] },
    MK: { name: 'Macedonia, the Former Yugoslav Republic of', flag: '🇲🇰', code: '+389', addressFields: ['street', 'city', 'postalCode'] },
    MG: { name: 'Madagascar', flag: '🇲🇬', code: '+261', addressFields: ['street', 'city', 'region', 'postalCode'] },
    MW: { name: 'Malawi', flag: '🇲🇼', code: '+265', addressFields: ['street', 'city', 'region', 'postalCode'] },
    MY: { name: 'Malaysia', flag: '🇲🇾', code: '+60', addressFields: ['street', 'city', 'state', 'postcode'] },
    MV: { name: 'Maldives', flag: '🇲🇻', code: '+960', addressFields: ['street', 'atoll', 'island', 'postalCode'] },
    ML: { name: 'Mali', flag: '🇲🇱', code: '+223', addressFields: ['street', 'city', 'region'] },
    MT: { name: 'Malta', flag: '🇲🇹', code: '+356', addressFields: ['street', 'locality', 'postalCode'] },
    MH: { name: 'Marshall Islands', flag: '🇲🇭', code: '+692', addressFields: ['street', 'atoll', 'zipCode'] },
    MQ: { name: 'Martinique', flag: '🇲🇶', code: '+596', addressFields: ['street', 'city', 'postalCode'] },
    MR: { name: 'Mauritania', flag: '🇲🇷', code: '+222', addressFields: ['street', 'city', 'region'] },
    MU: { name: 'Mauritius', flag: '🇲🇺', code: '+230', addressFields: ['street', 'city', 'district', 'postalCode'] },
    YT: { name: 'Mayotte', flag: '🇾🇹', code: '+262', addressFields: ['street', 'village', 'postalCode'] },
    FM: { name: 'Micronesia, Federated States of', flag: '🇫🇲', code: '+691', addressFields: ['street', 'city', 'state', 'zipCode'] },
    MD: { name: 'Moldova, Republic of', flag: '🇲🇩', code: '+373', addressFields: ['street', 'city', 'district', 'postalCode'] },
    MC: { name: 'Monaco', flag: '🇲🇨', code: '+377', addressFields: ['street', 'postalCode'] },
    MN: { name: 'Mongolia', flag: '🇲🇳', code: '+976', addressFields: ['street', 'district', 'city', 'postalCode'] },
    ME: { name: 'Montenegro', flag: '🇲🇪', code: '+382', addressFields: ['street', 'city', 'postalCode'] },
    MS: { name: 'Montserrat', flag: '🇲🇸', code: '+1-664', addressFields: ['street', 'postalCode'] },
    MA: { name: 'Morocco', flag: '🇲🇦', code: '+212', addressFields: ['street', 'city', 'region', 'postalCode'] },
    MZ: { name: 'Mozambique', flag: '🇲🇿', code: '+258', addressFields: ['street', 'city', 'province', 'postalCode'] },
    MM: { name: 'Myanmar', flag: '🇲🇲', code: '+95', addressFields: ['street', 'ward', 'township', 'state/region', 'postalCode'] },
    NA: { name: 'Namibia', flag: '🇳🇦', code: '+264', addressFields: ['street', 'city', 'region', 'postalCode'] },
    NR: { name: 'Nauru', flag: '🇳🇷', code: '+674', addressFields: ['district'] },
    NP: { name: 'Nepal', flag: '🇳🇵', code: '+977', addressFields: ['street', 'city', 'district', 'postalCode'] },
    NL: { name: 'Netherlands', flag: '🇳🇱', code: '+31', addressFields: ['street', 'city', 'postalCode'] },
    NC: { name: 'New Caledonia', flag: '🇳🇨', code: '+687', addressFields: ['street', 'city', 'province', 'postalCode'] },
    NZ: { name: 'New Zealand', flag: '🇳🇿', code: '+64', addressFields: ['street', 'suburb', 'city', 'postcode'] },
    NI: { name: 'Nicaragua', flag: '🇳🇮', code: '+505', addressFields: ['street', 'city', 'department', 'postalCode'] },
    NE: { name: 'Niger', flag: '🇳🇪', code: '+227', addressFields: ['street', 'city', 'department', 'postalCode'] },
    NU: { name: 'Niue', flag: '🇳🇺', code: '+683', addressFields: ['village'] },
    NF: { name: 'Norfolk Island', flag: '🇳🇫', code: '+672', addressFields: ['street', 'postalCode'] },
    MP: { name: 'Northern Mariana Islands', flag: '🇲🇵', code: '+1-670', addressFields: ['street', 'village', 'island', 'zipCode'] },
    NO: { name: 'Norway', flag: '🇳🇴', code: '+47', addressFields: ['street', 'city', 'postalCode'] },
    OM: { name: 'Oman', flag: '🇴🇲', code: '+968', addressFields: ['street', 'city', 'governorate', 'postalCode'] },
    PK: { name: 'Pakistan', flag: '🇵🇰', code: '+92', addressFields: ['street', 'sector', 'city', 'province', 'postalCode'] },
    PW: { name: 'Palau', flag: '🇵🇼', code: '+680', addressFields: ['street', 'hamlet', 'state', 'zipCode'] },
    PS: { name: 'Palestine, State of', flag: '🇵🇸', code: '+970', addressFields: ['street', 'city', 'governorate'] },
    PA: { name: 'Panama', flag: '🇵🇦', code: '+507', addressFields: ['street', 'city', 'province'] },
    PG: { name: 'Papua New Guinea', flag: '🇵🇬', code: '+675', addressFields: ['street', 'city', 'province', 'postalCode'] },
    PY: { name: 'Paraguay', flag: '🇵🇾', code: '+595', addressFields: ['street', 'city', 'department', 'postalCode'] },
    PE: { name: 'Peru', flag: '🇵🇪', code: '+51', addressFields: ['street', 'city', 'department', 'postalCode'] },
    PH: { name: 'Philippines', flag: '🇵🇭', code: '+63', addressFields: ['street', 'barangay', 'city', 'province', 'zipCode'] },
    PL: { name: 'Poland', flag: '🇵🇱', code: '+48', addressFields: ['street', 'city', 'postalCode'] },
    PT: { name: 'Portugal', flag: '🇵🇹', code: '+351', addressFields: ['street', 'city', 'postalCode'] },
    PR: { name: 'Puerto Rico', flag: '🇵🇷', code: '+1-787', addressFields: ['street', 'city', 'zipCode'] },
    QA: { name: 'Qatar', flag: '🇶🇦', code: '+974', addressFields: ['street', 'zone', 'city'] },
    RE: { name: 'Réunion', flag: '🇷🇪', code: '+262', addressFields: ['street', 'city', 'postalCode'] },
    RO: { name: 'Romania', flag: '🇷🇴', code: '+40', addressFields: ['street', 'city', 'county', 'postalCode'] },
    RU: { name: 'Russian Federation', flag: '🇷🇺', code: '+7', addressFields: ['street', 'city', 'oblast/krai/republic', 'postalCode'] },
    SH: { name: 'Saint Helena', flag: '🇸🇭', code: '+290', addressFields: ['street', 'district', 'postcode'] },
    KN: { name: 'Saint Kitts and Nevis', flag: '🇰🇳', code: '+1-869', addressFields: ['street', 'parish'] },
    LC: { name: 'Saint Lucia', flag: '🇱🇨', code: '+1-758', addressFields: ['street', 'quarter'] },
    PM: { name: 'Saint Pierre and Miquelon', flag: '🇵🇲', code: '+508', addressFields: ['street', 'postalCode'] },
    VC: { name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', code: '+1-784', addressFields: ['street', 'parish'] },
    WS: { name: 'Samoa', flag: '🇼🇸', code: '+685', addressFields: ['street', 'village', 'district'] },
    SM: { name: 'San Marino', flag: '🇸🇲', code: '+378', addressFields: ['street', 'municipality', 'postalCode'] },
    ST: { name: 'Sao Tome and Principe', flag: '🇸🇹', code: '+239', addressFields: ['street', 'city', 'district'] },
    SA: { name: 'Saudi Arabia', flag: '🇸🇦', code: '+966', addressFields: ['street', 'district', 'city', 'postalCode'] },
    SN: { name: 'Senegal', flag: '🇸🇳', code: '+221', addressFields: ['street', 'city', 'region', 'postalCode'] },
    RS: { name: 'Serbia', flag: '🇷🇸', code: '+381', addressFields: ['street', 'city', 'postalCode'] },
    SC: { name: 'Seychelles', flag: '🇸🇨', code: '+248', addressFields: ['street', 'district', 'island'] },
    SL: { name: 'Sierra Leone', flag: '🇸🇱', code: '+232', addressFields: ['street', 'city', 'province'] },
    SG: { name: 'Singapore', flag: '🇸🇬', code: '+65', addressFields: ['street', 'building', 'postalCode'] },
    SX: { name: 'Sint Maarten (Dutch part)', flag: '🇸🇽', code: '+1-721', addressFields: ['street', 'city'] },
    SK: { name: 'Slovakia', flag: '🇸🇰', code: '+421', addressFields: ['street', 'city', 'postalCode'] },
    SI: { name: 'Slovenia', flag: '🇸🇮', code: '+386', addressFields: ['street', 'city', 'postalCode'] },
    SB: { name: 'Solomon Islands', flag: '🇸🇧', code: '+677', addressFields: ['street', 'city', 'province'] },
    SO: { name: 'Somalia', flag: '🇸🇴', code: '+252', addressFields: ['street', 'city', 'region', 'postalCode'] },
    ES: { name: 'Spain', flag: '🇪🇸', code: '+34', addressFields: ['street', 'city', 'province', 'postalCode'] },
    LK: { name: 'Sri Lanka', flag: '🇱🇰', code: '+94', addressFields: ['street', 'city', 'province', 'postalCode'] },
    SD: { name: 'Sudan', flag: '🇸🇩', code: '+249', addressFields: ['street', 'city', 'state'] },
    SR: { name: 'Suriname', flag: '🇸🇷', code: '+597', addressFields: ['street', 'city', 'district'] },
    SJ: { name: 'Svalbard and Jan Mayen', flag: '🇸🇯', code: '+47', addressFields: ['street', 'postalCode'] },
    SZ: { name: 'Swaziland', flag: '🇸🇿', code: '+268', addressFields: ['street', 'city', 'region', 'postalCode'] },
    SE: { name: 'Sweden', flag: '🇸🇪', code: '+46', addressFields: ['street', 'city', 'postalCode'] },
    CH: { name: 'Switzerland', flag: '🇨🇭', code: '+41', addressFields: ['street', 'city', 'postalCode'] },
    SY: { name: 'Syrian Arab Republic', flag: '🇸🇾', code: '+963', addressFields: ['street', 'city', 'governorate'] },
    TW: { name: 'Taiwan', flag: '🇹🇼', code: '+886', addressFields: ['street', 'district', 'city', 'postalCode'] },
    TJ: { name: 'Tajikistan', flag: '🇹🇯', code: '+992', addressFields: ['street', 'city', 'region', 'postalCode'] },
    TZ: { name: 'Tanzania, United Republic of', flag: '🇹🇿', code: '+255', addressFields: ['street', 'city', 'region', 'postalCode'] },
    TH: { name: 'Thailand', flag: '🇹🇭', code: '+66', addressFields: ['street', 'sub-district', 'district', 'province', 'postalCode'] },
    TL: { name: 'Timor-Leste', flag: '🇹🇱', code: '+670', addressFields: ['street', 'suco', 'administrativePost', 'municipality'] },
    TG: { name: 'Togo', flag: '🇹🇬', code: '+228', addressFields: ['street', 'city', 'region'] },
    TK: { name: 'Tokelau', flag: '🇹🇰', code: '+690', addressFields: ['atoll'] },
    TO: { name: 'Tonga', flag: '🇹🇴', code: '+676', addressFields: ['street', 'village', 'islandGroup'] },
    TT: { name: 'Trinidad and Tobago', flag: '🇹🇹', code: '+1-868', addressFields: ['street', 'city', 'region'] },
    TN: { name: 'Tunisia', flag: '🇹🇳', code: '+216', addressFields: ['street', 'city', 'governorate', 'postalCode'] },
    TR: { name: 'Turkey', flag: '🇹🇷', code: '+90', addressFields: ['street', 'district', 'province', 'postalCode'] },
    TM: { name: 'Turkmenistan', flag: '🇹🇲', code: '+993', addressFields: ['street', 'city', 'province', 'postalCode'] },
    TC: { name: 'Turks and Caicos Islands', flag: '🇹🇨', code: '+1-649', addressFields: ['street', 'island', 'postcode'] },
    TV: { name: 'Tuvalu', flag: '🇹🇻', code: '+688', addressFields: ['village', 'island'] },
    UG: { name: 'Uganda', flag: '🇺🇬', code: '+256', addressFields: ['street', 'city', 'district'] },
    UA: { name: 'Ukraine', flag: '🇺🇦', code: '+380', addressFields: ['street', 'city', 'oblast', 'postalCode'] },
    AE: { name: 'United Arab Emirates', flag: '🇦🇪', code: '+971', addressFields: ['street', 'city', 'emirate'] },
    UY: { name: 'Uruguay', flag: '🇺🇾', code: '+598', addressFields: ['street', 'city', 'department', 'postalCode'] },
    UZ: { name: 'Uzbekistan', flag: '🇺🇿', code: '+998', addressFields: ['street', 'city', 'region', 'postalCode'] },
    VU: { name: 'Vanuatu', flag: '🇻🇺', code: '+678', addressFields: ['street', 'city', 'province'] },
    VE: { name: 'Venezuela', flag: '🇻🇪', code: '+58', addressFields: ['street', 'city', 'state', 'postalCode'] },
    VN: { name: 'Viet Nam', flag: '🇻🇳', code: '+84', addressFields: ['street', 'ward', 'district', 'city/province', 'postalCode'] },
    VG: { name: 'Virgin Islands, British', flag: '🇻🇬', code: '+1-284', addressFields: ['street', 'island', 'postcode'] },
    VI: { name: 'Virgin Islands, U.S.', flag: '🇻🇮', code: '+1-340', addressFields: ['street', 'city', 'island', 'zipCode'] },
    WF: { name: 'Wallis and Futuna', flag: '🇼🇫', code: '+681', addressFields: ['village', 'kingdom', 'postalCode'] },
    YE: { name: 'Yemen', flag: '🇾🇪', code: '+967', addressFields: ['street', 'city', 'governorate'] },
    ZM: { name: 'Zambia', flag: '🇿🇲', code: '+260', addressFields: ['street', 'city', 'province', 'postalCode'] },
    ZW: { name: 'Zimbabwe', flag: '🇿🇼', code: '+263', addressFields: ['street', 'suburb', 'city', 'province'] },
};

// --- REUSABLE SEARCHABLE DROPDOWN COMPONENT ---
interface SearchableDropdownProps {
  options: { value: string; label: string; }[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const SearchableDropdown = ({ options, value, onChange, disabled }: SearchableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center transition-colors ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
            : 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent bg-white cursor-pointer'
        }`}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <svg className={`w-4 h-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white border-b">
            <div className="relative">
              <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-md pl-7 pr-2 py-1.5 text-sm"
                autoFocus
              />
            </div>
          </div>
          <ul>
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {option.label}
              </li>
            )) : <li className="px-3 py-2 text-sm text-gray-500">No results found</li>}
          </ul>
        </div>
      )}
    </div>
  );
};


export default function UserProfileSettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    setTimeout(() => {
      const now = new Date();
      setUser({
        id: 1, profile: '', name: 'John Doe', email: 'john.doe@example.com', phone: '5551234567', phoneCountryCode: 'US',
        country: 'US', state: 'New York', city: 'New York', street: '123 Main Street', zipCode: '10001', status: 'active',
        userType: 'host', created_at: '2024-01-15T10:30:00Z', updated_at: now.toISOString(), last_login: now.toISOString(),
        total_sessions: 127
      });
      setPostalCode('10001');
      setIsLoading(false);
    }, 1000);
  }, []);

  // --- HELPER FUNCTIONS ---

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'inactive': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'host': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'field agent': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatPhoneNumber = (phone: string, countryCodeKey: string) => {
    const country = countryData[countryCodeKey as keyof typeof countryData];
    if (!country || !phone) return phone;
    
    let formatted = phone;
    if (countryCodeKey === 'US' || countryCodeKey === 'CA') {
      if (phone.length === 10) formatted = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
    } else if (phone.length > 6) {
      formatted = `${phone.slice(0,3)} ${phone.slice(3,6)} ${phone.slice(6)}`;
    }
    return `${country.flag} ${country.code} ${formatted}`;
  };

  const getFullAddress = () => {
    if (!user || !user.country) return '';
    const countryInfo = countryData[user.country];
    if (!countryInfo) return 'No address data';

    const addressParts = countryInfo.addressFields
        .map(field => {
            if (getPostalCodeFieldName(countryInfo) === field) {
                return postalCode; // Use the state for the postal code
            }
            return user[field as keyof UserInfo];
        })
        .filter(Boolean);
    
    if (countryData[user.country]) {
        addressParts.push(countryData[user.country].name);
    }
    return addressParts.join(', ');
  };
  
  const getPostalCodeFieldName = (country: CountryInfo | undefined) => country?.addressFields.find(f => f.toLowerCase().includes('code') || f.toLowerCase().includes('cep'));
  
  const getPostalCodeLabel = (country: CountryInfo | undefined) => {
    const field = getPostalCodeFieldName(country);
    if (!field) return "Postal Code";
    switch(field) {
      case 'zipCode': return 'ZIP Code'; case 'postalCode': return 'Postal Code'; case 'postcode': return 'Postcode';
      case 'pinCode': return 'PIN Code'; case 'eircode': return 'Eircode'; case 'cep': return 'CEP';
      default: return "Postal Code";
    }
  };

  // --- EVENT HANDLERS ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !user) return;
    setTimeout(() => {
      setUser({ ...user, profile: previewUrl || '', updated_at: new Date().toISOString() });
      setUploadSuccess('Profile image uploaded successfully!');
      setSelectedFile(null); setPreviewUrl(null);
      setTimeout(() => setUploadSuccess(null), 3000);
    }, 1000);
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!'); return;
    }
    setTimeout(() => {
      if (user) setUser({ ...user, updated_at: new Date().toISOString() });
      setShowPasswordModal(false); setPasswords({ current: '', new: '', confirm: '' });
      alert('Password changed successfully!');
    }, 500);
  };

  const handleSaveChanges = () => {
    if (user) {
        const postalCodeField = getPostalCodeFieldName(countryData[user.country!]);
        const updatedUser = { ...user, updated_at: new Date().toISOString() };
        if (postalCodeField) (updatedUser as any)[postalCodeField] = postalCode;
        setUser(updatedUser);
    }
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation.toLowerCase() !== 'delete my account') {
      alert('Please type "delete my account" to confirm'); return;
    }
    alert('Account deletion request submitted.');
    setShowDeleteModal(false); setDeleteConfirmation('');
  };

  const handleCountryChange = (newCountryCode: string) => {
    if (!user) return;
    const newCountryInfo = countryData[newCountryCode];
    const oldCountryInfo = user.country ? countryData[user.country] : undefined;
    
    const updatedUser: UserInfo = { ...user, country: newCountryCode };

    if (oldCountryInfo) {
      oldCountryInfo.addressFields.forEach(field => {
        if (!newCountryInfo.addressFields.includes(field)) delete (updatedUser as any)[field];
      });
    }
    
    const newPostalField = getPostalCodeFieldName(newCountryInfo);
    if (!newPostalField) {
        setPostalCode('');
    } else {
        const oldPostalField = getPostalCodeFieldName(oldCountryInfo);
        if (newPostalField !== oldPostalField) setPostalCode('');
    }
    
    newCountryInfo.addressFields.forEach(field => {
      if (!(field in updatedUser)) (updatedUser as any)[field] = '';
    });
    setUser(updatedUser);
  };

  const handleFieldChange = (field: keyof UserInfo, value: string) => {
    if (user) setUser({ ...user, [field]: value });
  };

  const countryOptions = Object.entries(countryData)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(([code, data]) => ({ value: code, label: `${data.flag} ${data.name}` }));

  const phoneCountryOptions = Object.entries(countryData)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(([code, data]) => ({ value: code, label: `${data.flag} ${data.code}` }));


  // --- RENDER LOGIC ---

  if (isLoading) {
    return (
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-300 border-t-[#083A85] rounded-full mr-2"></div>
            <span className="text-gray-700 text-sm">Loading user profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><FaExclamationTriangle className="text-red-500 text-lg" /></div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-[#083A85] to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer">Try Again</button>
        </div>
      </div>
    );
  }

  if (!user) return null;
  
  const currentCountry: CountryInfo | undefined = user.country ? countryData[user.country] : undefined;
  const postalCodeLabel = getPostalCodeLabel(currentCountry);
  const postalCodeField = getPostalCodeFieldName(currentCountry);

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* User Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#083A85] to-blue-700 p-4 text-center">
                <h3 className="text-white text-md font-semibold mb-3">Profile Image</h3>
                <div className="relative mb-4">
                  {previewUrl || user.profile ? (
                    <img src={previewUrl || user.profile} alt={user.name} className="w-20 h-20 rounded-full mx-auto border-3 border-white/30 shadow-md object-cover"/>
                  ) : (
                    <div className="w-20 h-20 bg-white/20 rounded-full mx-auto border-3 border-white/30 shadow-md flex items-center justify-center">
                      <span className="text-white text-lg font-bold">{getInitials(user.name)}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-400 border-3 border-white rounded-full flex items-center justify-center"><FaCheck className="text-white text-xs" /></div>
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="block bg-white/20 hover:bg-white/30 border border-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"><FaCamera className="inline mr-1" /> Choose Image</label>
                    {selectedFile && (
                      <div className="space-y-2">
                        <p className="text-white/80 text-xs">{selectedFile.name}</p>
                        <button onClick={handleImageUpload} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"><FaUpload className="inline mr-1" /> Upload Image</button>
                      </div>
                    )}
                  </div>
                )}
                {uploadSuccess && (
                  <div className="mt-2 bg-blue-500/20 border border-blue-400/30 text-blue-100 px-2 py-1 rounded-lg text-xs"><FaCheck className="inline mr-1" /> {uploadSuccess}</div>
                )}
              </div>

              <div className="p-4">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{user.name}</h2>
                  <p className="text-gray-500 text-xs mb-3">ID: USER-{user.id.toString().padStart(6, '0')}</p>
                  <div className="flex items-center justify-center flex-wrap gap-2">
                    <div className={`inline-flex items-center gap-1 border px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || '')}`}><div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>{user.status?.charAt(0).toUpperCase()}{user.status?.slice(1)} Status</div>
                    <div className={`inline-flex items-center gap-2 border px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.userType || '')}`}><FaUserCircle className="text-xs" />{user.userType === 'field agent' ? 'Field Agent' : (user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'User')}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600"><FaEnvelope className="text-[#083A85] text-xs" /><span className="text-xs">{user.email}</span></div>
                  <div className="flex items-center gap-2 text-gray-600"><FaPhone className="text-[#083A85] text-xs" /><span className="text-xs">{formatPhoneNumber(user.phone || '', user.phoneCountryCode || 'US')}</span></div>
                  <div className="flex items-start gap-2 text-gray-600"><FaMapMarkerAlt className="text-[#083A85] text-xs mt-0.5" /><span className="text-xs">{getFullAddress()}</span></div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <button onClick={() => setShowPasswordModal(true)} className="w-full bg-gradient-to-r from-[#083A85] to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"><FaKey /> Change Password</button>
                  <button onClick={() => setShowDeleteModal(true)} className="w-full bg-gradient-to-r from-[#F20C8F] to-pink-600 hover:from-pink-700 hover:to-pink-800 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"><FaTrash /> Delete Account</button>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#083A85] to-blue-700 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Profile Information</h3>
                  {!isEditing && <button onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 cursor-pointer"><FaPencilAlt className="text-xs" /> Edit</button>}
                </div>
              </div>

              <div className="p-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div><label className="block text-gray-700 text-xs font-semibold mb-1">Full Name</label><input type="text" value={user.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} disabled={!isEditing} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`} /></div>
                  <div><label className="block text-gray-700 text-xs font-semibold mb-1">User ID</label><input type="text" value={`USER-${user.id.toString().padStart(6, '0')}`} disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed" /></div>
                  <div><label className="block text-gray-700 text-xs font-semibold mb-1">Email Address</label><input type="email" value={user.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} disabled={!isEditing} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`} /></div>
                  <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1">Phone Number</label>
                    <div className="flex gap-2">
                        <div className="w-28">
                            <SearchableDropdown options={phoneCountryOptions} value={user.phoneCountryCode || ''} onChange={(value) => handleFieldChange('phoneCountryCode', value)} disabled={!isEditing}/>
                        </div>
                        <input type="tel" value={user.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} disabled={!isEditing} placeholder="Phone number" className={`flex-1 border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`} />
                    </div>
                  </div>

                  {/* Address Fields */}
                  <div className="sm:col-span-2"><h4 className="text-gray-700 text-xs font-bold mb-2 border-b pb-1">Address Information</h4></div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 text-xs font-semibold mb-1">Country</label>
                    <SearchableDropdown options={countryOptions} value={user.country || ''} onChange={handleCountryChange} disabled={!isEditing} />
                  </div>

                  {currentCountry?.addressFields.filter(f => !postalCodeField || f !== postalCodeField).map(field => {
                    const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    if (field === 'state' && currentCountry.states) { return (<div key={field}><label className="block text-gray-700 text-xs font-semibold mb-1">{label}</label><select value={user.state || ''} onChange={(e) => handleFieldChange('state', e.target.value)} disabled={!isEditing} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`}><option value="">Select {label}</option>{currentCountry.states.map(s => <option key={s} value={s}>{s}</option>)}</select></div>); }
                    if (field === 'province' && currentCountry.provinces) { return (<div key={field}><label className="block text-gray-700 text-xs font-semibold mb-1">{label}</label><select value={user.province || ''} onChange={(e) => handleFieldChange('province', e.target.value)} disabled={!isEditing} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`}><option value="">Select {label}</option>{currentCountry.provinces.map(p => <option key={p} value={p}>{p}</option>)}</select></div>); }
                    return (<div key={field}><label className="block text-gray-700 text-xs font-semibold mb-1">{label}</label><input type="text" value={user[field as keyof UserInfo] as string || ''} onChange={(e) => handleFieldChange(field as keyof UserInfo, e.target.value)} disabled={!isEditing} placeholder={`Enter ${label.toLowerCase()}`} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`} /></div>);
                  })}
                  
                  {postalCodeField && (<div><label className="block text-gray-700 text-xs font-semibold mb-1">{postalCodeLabel}</label><input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={!isEditing} placeholder={`Enter ${postalCodeLabel.toLowerCase()}`} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`}/></div>)}

                  {/* Account Settings */}
                  <div><label className="block text-gray-700 text-xs font-semibold mb-1">Profile Status</label><select value={user.status || 'active'} onChange={(e) => handleFieldChange('status', e.target.value)} disabled={!isEditing} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`}><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option></select></div>
                  <div><label className="block text-gray-700 text-xs font-semibold mb-1">User Type</label><select value={user.userType || 'host'} onChange={(e) => handleFieldChange('userType', e.target.value)} disabled={!isEditing} className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-transparent cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'}`}><option value="host">Host</option><option value="field agent">Field Agent</option></select></div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer">Cancel</button>
                    <button onClick={handleSaveChanges} className="px-3 py-2 bg-gradient-to-r from-[#083A85] to-blue-700 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all transform hover:scale-105 shadow-md text-sm cursor-pointer">Save Changes</button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Activity */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#083A85] to-blue-700 p-4"><h3 className="text-lg font-bold text-white">Profile Activity</h3></div>
                <div className="p-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-[#083A85]/5 to-[#083A85]/10 border border-[#083A85]/20 rounded-lg p-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#083A85] rounded-lg flex items-center justify-center"><FaCalendarPlus className="text-white text-sm" /></div><div><h4 className="text-gray-900 font-semibold text-sm">Profile Created</h4><p className="text-gray-600 text-xs">{formatDate(user.created_at)}</p></div></div></div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><FaEdit className="text-white text-sm" /></div><div><h4 className="text-gray-900 font-semibold text-sm">Last Updated</h4><p className="text-gray-600 text-xs">{formatDate(user.updated_at)}</p></div></div></div>
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><FaShieldAlt className="text-white text-sm" /></div><div><h4 className="text-gray-900 font-semibold text-sm">Security Status</h4><p className="text-gray-600 text-xs">Two-Factor Auth: Enabled</p></div></div></div>
                        <div className="bg-gradient-to-r from-[#083A85]/5 to-[#083A85]/10 border border-[#083A85]/20 rounded-lg p-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#083A85] rounded-lg flex items-center justify-center"><FaUserCircle className="text-white text-sm" /></div><div><h4 className="text-gray-900 font-semibold text-sm">Last Login</h4><p className="text-gray-600 text-xs">{formatDate(user.last_login || user.updated_at)}</p></div></div></div>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center text-sm"><span className="text-gray-600">Total Sessions:</span><span className="font-semibold text-gray-900">{user.total_sessions || 0}</span></div>
                        <div className="flex justify-between items-center text-sm mt-2"><span className="text-gray-600">Account Age:</span><span className="font-semibold text-gray-900">{Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} days</span></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-[#083A85] to-blue-700 p-4 rounded-t-lg"><h3 className="text-white font-bold text-lg">Change Password</h3></div>
            <div className="p-4 space-y-4">
              <div><label className="block text-gray-700 text-xs font-semibold mb-1">Current Password</label><input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#083A85] focus:border-transparent" placeholder="Enter current password"/></div>
              <div><label className="block text-gray-700 text-xs font-semibold mb-1">New Password</label><input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#083A85] focus:border-transparent" placeholder="Enter new password"/></div>
              <div><label className="block text-gray-700 text-xs font-semibold mb-1">Confirm New Password</label><input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#083A85] focus:border-transparent" placeholder="Confirm new password"/></div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button onClick={() => { setShowPasswordModal(false); setPasswords({ current: '', new: '', confirm: '' }); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer">Cancel</button>
              <button onClick={handlePasswordChange} className="px-4 py-2 bg-gradient-to-r from-[#083A85] to-blue-700 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 transition-all text-sm cursor-pointer">Change Password</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-[#F20C8F] to-pink-600 p-4 rounded-t-lg"><h3 className="text-white font-bold text-lg">Delete Account</h3></div>
            <div className="p-4">
              <div className="mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-red-700 text-sm"><strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.</p></div>
                <label className="block text-gray-700 text-xs font-semibold mb-1">Type "delete my account" to confirm</label>
                <input type="text" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#F20C8F] focus:border-transparent" placeholder="delete my account"/>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer">Cancel</button>
              <button onClick={handleDeleteAccount} className="px-4 py-2 bg-gradient-to-r from-[#F20C8F] to-pink-600 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all text-sm cursor-pointer">Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}