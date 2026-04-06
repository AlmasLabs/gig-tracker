export const getCountryCode = (address: string) => {
  if (!address) return null;
  
  const parts = address.split(',');
  const country = parts[parts.length - 1].trim().toLowerCase();

  const countryMap: { [key: string]: string } = {
    'norway': 'no', 'norge': 'no',
    'sweden': 'se', 'sverige': 'se',
    'denmark': 'dk', 'danmark': 'dk',
    'germany': 'de', 'tyskland': 'de',
    'uk': 'gb', 'united kingdom': 'gb', 'storbritannia': 'gb',
    'usa': 'us', 'united states': 'us',
    'france': 'fr', 'frankrike': 'fr',
    'italy': 'it', 'italia': 'it',
    'spain': 'es', 'spania': 'es',
    'netherlands': 'nl', 'nederland': 'nl'
  };

  return countryMap[country] || null;
};