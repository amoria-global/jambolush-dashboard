//app/pages/profile.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/app/api/apiService";
import { uploadProfilePictureToSupabase } from '../api/storage'; 

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

// --- COUNTRY DATA (CONDENSED) ---

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
  placeholder?: string;
}

const SearchableDropdown = ({ options, value, onChange, disabled, placeholder = "Select..." }: SearchableDropdownProps) => {
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center transition-colors ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer hover:border-gray-400'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className={`w-4 h-4 text-gray-400 transform transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
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
  const [originalUser, setOriginalUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });


  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken') || '';
        api.setAuth(token || '')
        const response = await api.get('auth/me');

        if (response.data) {
          setUser(response.data);
          setOriginalUser(response.data);

          // Set postal code from appropriate field
          const currentCountry = countryData[response.data.country];
          if (currentCountry) {
            const postalField = getPostalCodeFieldName(currentCountry);
            if (postalField && response.data[postalField as keyof UserInfo]) {
              setPostalCode(response.data[postalField as keyof UserInfo] as string);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch user data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load user profile');

        // If unauthorized, handle logout
        if (err.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle logout (similar to your example)
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
    window.location.href = process.env.FRONTEND_URL + '/all/login?redirect=' + encodeURIComponent(window.location.href);
  };

  // --- HELPER FUNCTIONS ---

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      case 'agent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'field agent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'user': return 'bg-green-100 text-green-700 border-green-200';
      case 'guest': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'moderator': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatUserType = (type: string) => {
    if (!type) return 'User';
    switch (type.toLowerCase()) {
      case 'agent': return 'Agent';
      case 'field agent': return 'Field Agent';
      case 'admin': return 'Administrator';
      case 'user': return 'User';
      case 'host': return 'Host';
      case 'guest': return 'Guest';
      case 'moderator': return 'Moderator';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
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
                return postalCode;
            }
            return user[field as keyof UserInfo];
        })
        .filter(Boolean);
    
    if (countryData[user.country]) {
        addressParts.push(countryData[user.country].name);
    }
    return addressParts.join(', ');
  };
  
  const getPostalCodeFieldName = (country: CountryInfo | undefined) => 
    country?.addressFields.find(f => f.toLowerCase().includes('code') || f.toLowerCase().includes('cep'));
  
  const getPostalCodeLabel = (country: CountryInfo | undefined) => {
    const field = getPostalCodeFieldName(country);
    if (!field) return "Postal Code";
    switch(field) {
      case 'zipCode': return 'ZIP Code'; 
      case 'postalCode': return 'Postal Code'; 
      case 'postcode': return 'Postcode';
      case 'pinCode': return 'PIN Code'; 
      case 'eircode': return 'Eircode'; 
      case 'cep': return 'CEP';
      default: return "Postal Code";
    }
  };

const hasChanges = () => {
  if (!user || !originalUser) return false;
  
  // Check if there's a new image file selected
  if (selectedFile) {
    return true;
  }
  
  // Check if profile image URL has changed
  const currentProfile = (user.profile || '').trim();
  const originalProfile = (originalUser.profile || '').trim();
  if (currentProfile !== originalProfile) {
    return true;
  }
  
  // Get current postal code field name
  const currentCountry = user.country ? countryData[user.country] : undefined;
  const postalField = getPostalCodeFieldName(currentCountry);
  
  // Get original postal code for comparison
  const originalPostalCode = originalUser.country && postalField ? 
    (originalUser[postalField as keyof UserInfo] as string || '') : '';
  
  // Compare basic fields
  const fieldsToCompare = [
    'name', 'phone', 'phoneCountryCode', 'country', 
    'street', 'city', 'state', 'province', 'district', 'county', 'region'
  ];
  
  // Check if any basic field has changed
  for (const field of fieldsToCompare) {
    const currentValue = (user[field as keyof UserInfo] as string || '').trim();
    const originalValue = (originalUser[field as keyof UserInfo] as string || '').trim();
    if (currentValue !== originalValue) {
      return true;
    }
  }
  
  // Check postal code
  if (postalCode.trim() !== originalPostalCode.trim()) {
    return true;
  }
  
  return false;
};

  // --- EVENT HANDLERS ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
  if (!selectedFile || !user) return;
  
  try {
    setIsSaving(true);
    console.log('Starting image upload...');
    
    const imageUrl = await uploadProfilePictureToSupabase(
      selectedFile, 
      user.phone || user.id.toString()
    );
    
    console.log('Image uploaded to Supabase, URL:', imageUrl);
    
    // Now send the URL to backend via centralized API service
    const token = localStorage.getItem('authToken');
    api.setAuth(token || '');
    
    const response = await api.updateProfileImage(imageUrl);
    
    if (response.data.success && response.data.data) {
      setUser({ ...user, profile: imageUrl, updated_at: new Date().toISOString() });
      const profileUpdateEvent = new CustomEvent('profileImageUpdated', {
        detail: { profile: imageUrl }
      });
      window.dispatchEvent(profileUpdateEvent);
      setUploadSuccess('Profile image uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  } catch (error: any) {
    console.error('Image upload failed:', error);
    setSaveMessage({ 
      type: 'error', 
      text: error.message || 'Failed to upload image' 
    });
  } finally {
    setIsSaving(false);
  }
};

// Update the combined save function
const handleSaveChanges = async () => {
  if (!user) return;
  
  try {
    setIsSaving(true);
    setSaveMessage(null);
    
    if (!hasChanges()) {
      setSaveMessage({ type: 'info', text: 'No changes made' });
      setIsEditing(false);
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    
    let updatedProfileUrl = user.profile;
    
    // Handle image upload first if there's a selected file
    if (selectedFile) {
      try {
        // Upload to Supabase
        updatedProfileUrl = await uploadProfilePictureToSupabase(
          selectedFile, 
          user.phone || user.id.toString()
        );
        
        // Send URL to backend via API service
        const token = localStorage.getItem('authToken');
        api.setAuth(token || '');
        await api.updateProfileImage(updatedProfileUrl);
        
        // Update user state with new profile image
        setUser({ ...user, profile: updatedProfileUrl });
        setSelectedFile(null);
        setPreviewUrl(null);
      } catch (imageError) {
        console.error('Image upload failed:', imageError);
        setSaveMessage({ 
          type: 'error', 
          text: 'Failed to upload image. Please try again.' 
        });
        return;
      }
    }
    
    // Prepare data for profile update API
    const updateData: any = {
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      phone: user.phone,
      phoneCountryCode: user.phoneCountryCode,
      country: user.country,
      street: user.street,
      city: user.city,
      state: user.state,
      province: user.province,
      district: user.district,
      county: user.county,
      region: user.region
    };

    // Handle dynamic postal code field
    const currentCountry = countryData[user.country!];
    const postalField = getPostalCodeFieldName(currentCountry);
    if (postalField && postalCode) {
      updateData[postalField] = postalCode;
    }

    // Remove undefined/empty values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    // Use the existing updateProfile method from API service
    const response = await api.put('auth/me', updateData);

    if (response.data) {
      const finalUser = {
        ...user,
        ...response.data,
        profile: updatedProfileUrl,
        updated_at: new Date().toISOString(),
        name: `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim()
      };
      
      setUser(finalUser);
      setOriginalUser(finalUser);
      
      // Dispatch profile update events
      const profileUpdateEvent = new CustomEvent('profileUpdated', {
        detail: {
          user: finalUser,
          profile: updatedProfileUrl,
          name: finalUser.name,
          firstName: finalUser.firstName,
          lastName: finalUser.lastName,
          email: finalUser.email,
          phone: finalUser.phone,
          country: finalUser.country,
          city: finalUser.city,
          userType: finalUser.userType,
        }
      });
      window.dispatchEvent(profileUpdateEvent);
      
      if (updatedProfileUrl && updatedProfileUrl !== originalUser?.profile) {
        const legacyEvent = new CustomEvent('profileImageUpdated', {
          detail: { profile: updatedProfileUrl }
        });
        window.dispatchEvent(legacyEvent);
      }
      
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  } catch (error: any) {
    console.error('Profile update failed:', error);
    setSaveMessage({ 
      type: 'error', 
      text: error.response?.data?.message || error.message || 'Failed to update profile' 
    });
  } finally {
    setIsSaving(false);
  }
};

  const handleCountryChange = (newCountryCode: string) => {
    if (!user) return;
    const newCountryInfo = countryData[newCountryCode];
    const oldCountryInfo = user.country ? countryData[user.country] : undefined;
    
    const updatedUser: UserInfo = { ...user, country: newCountryCode };

    // Clear old address fields that don't exist in new country
    if (oldCountryInfo) {
      oldCountryInfo.addressFields.forEach(field => {
        if (!newCountryInfo.addressFields.includes(field)) {
          delete (updatedUser as any)[field];
        }
      });
    }
    
    // Reset postal code if field name changes
    const newPostalField = getPostalCodeFieldName(newCountryInfo);
    if (!newPostalField) {
        setPostalCode('');
    } else {
        const oldPostalField = getPostalCodeFieldName(oldCountryInfo);
        if (newPostalField !== oldPostalField) {
          setPostalCode('');
        }
    }
    
    // Initialize new address fields
    newCountryInfo.addressFields.forEach(field => {
      if (!(field in updatedUser)) {
        (updatedUser as any)[field] = '';
      }
    });
    
    setUser(updatedUser);
  };

  const handleFieldChange = (field: keyof UserInfo, value: string) => {
    if (user) setUser({ ...user, [field]: value });
  };


  const handleCancelEdit = () => {
    if (originalUser) {
      setUser(originalUser);
      const currentCountry = countryData[originalUser.country!];
      if (currentCountry) {
        const postalField = getPostalCodeFieldName(currentCountry);
        if (postalField && originalUser[postalField as keyof UserInfo]) {
          setPostalCode(originalUser[postalField as keyof UserInfo] as string);
        }
      }
    }
    setIsEditing(false);
    setSaveMessage(null);
  };

  // Password change handler
  // Password change handler
  const handlePasswordChange = async () => {
    // Validate all fields are filled
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }

    // Validate that the new passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    // Validate new password length (8 characters minimum)
    if (passwordData.newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }

    try {
      setPasswordLoading(true);
      setSaveMessage(null); // Clear any previous messages

      // The API service uses the token set on page load, no need to set it again here
      const response = await api.changeUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (response.data.success) {
        setSaveMessage({ type: 'success', text: 'Password changed successfully!' });
        // Clear the form fields for security after a successful change
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        // Hide the success message after 5 seconds
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        // Handle cases where the API call is successful but the operation failed
        throw new Error(response.data.message || 'Failed to change password due to a server error.');
      }
    } catch (error: any) {
      console.error('Password change failed:', error);
      // Display a user-friendly error message from the API response
      setSaveMessage({
        type: 'error',
        text: error.data?.message || error.response?.data?.message || error.message || 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setPasswordLoading(false);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Loading Profile</h2>
          <p className="text-gray-600">Please wait while we fetch your information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Profile Data</h2>
          <p className="text-gray-600 mb-6">Unable to load your profile information</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;


  const currentCountry: CountryInfo | undefined = user.country ? countryData[user.country] : undefined;
  const postalCodeLabel = getPostalCodeLabel(currentCountry);
  const postalCodeField = getPostalCodeFieldName(currentCountry);

  return (
    <div className="pt-20">
      <div className="">
        
        {/* Alert Messages */}
{saveMessage && (
  <div className={`mb-6 p-4 rounded-lg border ${
    saveMessage.type === 'success' 
      ? 'bg-green-50 border-green-200 text-green-800' 
      : saveMessage.type === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-blue-50 border-blue-200 text-blue-800' // Info type
  }`}>
    <div className="flex items-center">
      <svg className={`w-5 h-5 mr-2 ${
        saveMessage.type === 'success' ? 'text-green-500' 
        : saveMessage.type === 'error' ? 'text-red-500'
        : 'text-blue-500' // Info type
      }`} fill="currentColor" viewBox="0 0 20 20">
        {saveMessage.type === 'success' ? (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        ) : saveMessage.type === 'error' ? (
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        ) : (
          // Info icon
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        )}
      </svg>
      {saveMessage.text}
    </div>
  </div>
)}

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
                <h3 className="text-white text-lg font-semibold mb-4">Profile Image</h3>
                <div className="relative mb-4">
                  {previewUrl || user.profile ? (
                    <img 
                      src={previewUrl || user.profile} 
                      alt={user.name} 
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto border-4 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{getInitials(user.name)}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      id="image-upload" 
                    />
                    <label 
                      htmlFor="image-upload" 
                      className="block bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      Choose Image
                    </label>
                    {selectedFile && (
                      <div className="space-y-2">
                        <p className="text-white/80 text-sm truncate px-2">{selectedFile.name}</p>
                        <button 
                          onClick={handleImageUpload}
                          disabled={isSaving}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center w-full"
                        >
                          {isSaving ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                          )}
                          {isSaving ? 'Uploading...' : 'Upload Image'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="mt-3 bg-green-500/20 border border-green-400/30 text-green-100 px-3 py-2 rounded-lg text-sm">
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {uploadSuccess}
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
                  <p className="text-gray-500 mb-4">ID: USER-{user?.id?.toString().padStart(6, '0') || 'Loading...'}</p>
                  <div className="flex items-center justify-center flex-wrap gap-2">
                    <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status || '')}`}>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      {user.status?.charAt(0).toUpperCase()}{user.status?.slice(1)} Status
                    </div>
                    <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(user.userType || '')}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {formatUserType(user.userType || '')}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-sm break-all">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      <span className="text-sm">{formatPhoneNumber(user.phone, user.phoneCountryCode || 'US')}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="text-sm">{getFullAddress() || 'No address provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Profile Information</h3>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg cursor-pointer font-medium transition-all disabled:opacity-50 "
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-2 transition-all disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Basic Information</h4>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={user.name || ''} 
                      onChange={(e) => handleFieldChange('name', e.target.value)} 
                      disabled={!isEditing} 
                      className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">User ID</label>
                    <input 
                      type="text" 
                      value={`USER-${user?.id?.toString().padStart(6, '0') || 'Loading...'}`} 
                      disabled 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={user.email || ''} 
                      disabled 
                      className="w-full border rounded-lg px-3 py-2 transition-colors bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                    <div className="flex gap-3">
                      <div className="w-32 flex-shrink-0">
                        <SearchableDropdown 
                          options={phoneCountryOptions} 
                          value={user.phoneCountryCode || ''} 
                          onChange={(value) => handleFieldChange('phoneCountryCode', value)} 
                          disabled={!isEditing}
                          placeholder="Country"
                        />
                      </div>
                      <input 
                        type="tel" 
                        value={user.phone || ''} 
                        onChange={(e) => handleFieldChange('phone', e.target.value)} 
                        disabled={!isEditing} 
                        placeholder="Phone number" 
                        className={`flex-1 border rounded-lg px-3 py-2 transition-colors ${
                          isEditing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                        }`} 
                      />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Address Information</h4>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-semibold mb-2">Country</label>
                    <SearchableDropdown 
                      options={countryOptions} 
                      value={user.country || ''} 
                      onChange={handleCountryChange} 
                      disabled={!isEditing}
                      placeholder="Select country"
                    />
                  </div>

                  {currentCountry?.addressFields.filter(f => !postalCodeField || f !== postalCodeField).map(field => {
                    const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    if (field === 'state' && currentCountry.states) {
                      return (
                        <div key={field}>
                          <label className="block text-gray-700 font-semibold mb-2">{label}</label>
                          <select 
                            value={user.state || ''} 
                            onChange={(e) => handleFieldChange('state', e.target.value)} 
                            disabled={!isEditing} 
                            className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                              isEditing 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            <option value="">Select {label}</option>
                            {currentCountry.states.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    
                    if (field === 'province' && currentCountry.provinces) {
                      return (
                        <div key={field}>
                          <label className="block text-gray-700 font-semibold mb-2">{label}</label>
                          <select 
                            value={user.province || ''} 
                            onChange={(e) => handleFieldChange('province', e.target.value)} 
                            disabled={!isEditing} 
                            className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                              isEditing 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            <option value="">Select {label}</option>
                            {currentCountry.provinces.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={field}>
                        <label className="block text-gray-700 font-semibold mb-2">{label}</label>
                        <input 
                          type="text" 
                          value={user[field as keyof UserInfo] as string || ''} 
                          onChange={(e) => handleFieldChange(field as keyof UserInfo, e.target.value)} 
                          disabled={!isEditing} 
                          placeholder={`Enter ${label.toLowerCase()}`} 
                          className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                          }`} 
                        />
                      </div>
                    );
                  })}
                  
                  {postalCodeField && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">{postalCodeLabel}</label>
                      <input 
                        type="text" 
                        value={postalCode} 
                        onChange={(e) => setPostalCode(e.target.value)} 
                        disabled={!isEditing} 
                        placeholder={`Enter ${postalCodeLabel.toLowerCase()}`} 
                        className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                          isEditing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  )}

                  {/* Security Settings */}
                  <div className="md:col-span-2">
                    <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Security Settings</h4>
                  </div>

                  {/* Change Password Form */}
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-gray-800 font-semibold">Change Password</h5>
                        <div className="text-xs text-gray-500">
                          Password must be at least 8 characters
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              disabled={!isEditing}
                              placeholder="Enter current password"
                              className={`w-full border rounded-lg px-3 py-2 pr-10 transition-colors ${
                                isEditing
                                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                              }`}
                            />
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {showPasswords.current ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  )}
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              disabled={!isEditing}
                              placeholder="Enter new password"
                              className={`w-full border rounded-lg px-3 py-2 pr-10 transition-colors ${
                                isEditing
                                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                              }`}
                            />
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {showPasswords.new ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  )}
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              disabled={!isEditing}
                              placeholder="Confirm new password"
                              className={`w-full border rounded-lg px-3 py-2 pr-10 transition-colors ${
                                isEditing
                                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                              }`}
                            />
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {showPasswords.confirm ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  )}
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={handlePasswordChange}
                            disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {passwordLoading ? (
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                            {passwordLoading ? 'Changing Password...' : 'Change Password'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Settings */}
                  <div className="md:col-span-2">
                    <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Account Settings</h4>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Profile Status</label>
                    <select 
                      value={user.status || 'active'} 
                      disabled 
                      className="w-full border rounded-lg px-3 py-2 transition-colors bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">User Type</label>
                    <select
                      value={user.userType || 'user'}
                      disabled
                      className="w-full border rounded-lg px-3 py-2 transition-colors bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                    >
                      <option value="user">User</option>
                      <option value="guest">Guest</option>
                      <option value="host">Host</option>
                      <option value="agent">Agent</option>
                      <option value="field agent">Field Agent</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Your user type is determined by your account role and cannot be changed here.
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Profile Activity */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <h3 className="text-lg font-bold text-white">Profile Activity</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Profile Created</h4>
                        <p className="text-gray-600 text-sm truncate">{formatDate(user.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Last Updated</h4>
                        <p className="text-gray-600 text-sm truncate">{formatDate(user.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Security Status</h4>
                        <p className="text-gray-600 text-sm">Account Verified</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Last Login</h4>
                        <p className="text-gray-600 text-sm truncate">{formatDate(user.last_login || user.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{user.total_sessions || 0}</div>
                      <div className="text-gray-600 text-sm">Total Sessions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {user.created_at ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                      </div>
                      <div className="text-gray-600 text-sm">Days Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}