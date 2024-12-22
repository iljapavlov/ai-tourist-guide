const predefinedRoutes = [
    {
      id: 'route1',
      name: 'Old Town Tour',
      waypoints: [
        { latitude: 56.9475, longitude: 24.1054, title: 'Town Hall Square' },
        { latitude: 56.9489, longitude: 24.1064, title: 'St. Peter’s Church' },
        { latitude: 56.9514, longitude: 24.1134, title: 'Freedom Monument' },
      ],
      pointsOfInterest: [
        { latitude: 56.9507, longitude: 24.1121, title: 'House of the Blackheads' },
        { latitude: 56.9460, longitude: 24.1046, title: 'Riga Cathedral' },
      ],
    },
    {
      id: 'route2',
      name: 'Art Nouveau District',
      waypoints: [
        { latitude: 56.9607, longitude: 24.1072, title: 'Start Point' },
        { latitude: 56.9589, longitude: 24.1069, title: 'Alberta Street' },
        { latitude: 56.9563, longitude: 24.1015, title: 'End Point' },
      ],
      pointsOfInterest: [
        { latitude: 56.9581, longitude: 24.1036, title: 'Art Nouveau Museum' },
        { latitude: 56.9593, longitude: 24.1076, title: 'Jugendstil Architecture' },
      ],
    },
  ];
  
  export default predefinedRoutes;
  