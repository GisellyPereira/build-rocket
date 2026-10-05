export type Destination = {
  id: string;
  texture: number;
  preview: number;
  name: string;
  subtitle: string;
  query: string;
  color: string;
  kind: number;
  radius: string;
  day: string;
  temperature: string;
  description: string;
  fact: string;
};

export const destinations: Destination[] = [
  {
    id: "earth",
    texture: require("../../assets/planets/earth.jpg"),
    preview: require("../../assets/planets/earth-preview.png"),
    name: "Terra",
    subtitle: "NOSSO PONTO DE PARTIDA",
    query: "earth from space",
    color: "#7ACBFF",
    kind: 0,
    radius: "6.371 km",
    day: "24 horas",
    temperature: "15 °C",
    description:
      "Oceanos, nuvens e uma fina atmosfera. Vista de longe, nossa casa revela o quanto tudo está conectado.",
    fact: "A luz do Sol leva aproximadamente 8 minutos e 20 segundos para chegar à Terra.",
  },
  {
    id: "mars",
    texture: require("../../assets/planets/mars.jpg"),
    preview: require("../../assets/planets/mars-preview.png"),
    name: "Marte",
    subtitle: "O PRÓXIMO HORIZONTE",
    query: "mars surface",
    color: "#F7A18C",
    kind: 1,
    radius: "3.390 km",
    day: "24 h 37 min",
    temperature: "−65 °C",
    description:
      "Dunas avermelhadas, cânions gigantes e vestígios de um passado com água. Um mundo que ainda guarda muitas perguntas.",
    fact: "Olympus Mons, em Marte, é um vulcão com cerca de 22 km de altura.",
  },
  {
    id: "jupiter",
    texture: require("../../assets/planets/jupiter.jpg"),
    preview: require("../../assets/planets/jupiter-preview.png"),
    name: "Júpiter",
    subtitle: "UM GIGANTE EM MOVIMENTO",
    query: "jupiter juno",
    color: "#EBC4A0",
    kind: 2,
    radius: "69.911 km",
    day: "9 h 56 min",
    temperature: "−110 °C",
    description:
      "Faixas de nuvens e tempestades colossais envolvem o maior planeta do Sistema Solar. Aqui, tudo acontece em outra escala.",
    fact: "A Grande Mancha Vermelha é uma tempestade observada há mais de um século.",
  },
  {
    id: "saturn",
    texture: require("../../assets/planets/saturn.jpg"),
    preview: require("../../assets/planets/saturn-preview.png"),
    name: "Saturno",
    subtitle: "ALÉM DOS ANÉIS",
    query: "saturn cassini",
    color: "#E6D1A0",
    kind: 3,
    radius: "58.232 km",
    day: "10 h 42 min",
    temperature: "−140 °C",
    description:
      "Anéis de gelo e rocha desenham uma silhueta inconfundível. Ao redor, luas como Titã e Encélado expandem nossa curiosidade.",
    fact: "Os anéis de Saturno são compostos principalmente por partículas de gelo.",
  },
  {
    id: "moon",
    texture: require("../../assets/planets/moon.jpg"),
    preview: require("../../assets/planets/moon-preview.png"),
    name: "Lua",
    subtitle: "TÃO PERTO. TÃO EXTRAORDINÁRIA.",
    query: "moon lunar surface",
    color: "#D5D8EE",
    kind: 4,
    radius: "1.737 km",
    day: "29,5 dias",
    temperature: "−173 a 127 °C",
    description:
      "Crateras registram bilhões de anos de história. Nosso satélite foi o primeiro destino humano além da Terra.",
    fact: "A Lua se afasta da Terra aproximadamente 3,8 centímetros por ano.",
  },
];

export const atlasTopics = [
  {
    name: "Nebulosas",
    query: "nebula hubble",
    label: "ONDE ESTRELAS NASCEM",
    color: "#BAA0FF",
  },
  {
    name: "Apollo",
    query: "apollo 11",
    label: "UM SALTO NA HISTÓRIA",
    color: "#D9DCE7",
  },
  {
    name: "Galáxias",
    query: "galaxy webb",
    label: "OUTRAS ESCALAS",
    color: "#91BFFF",
  },
  {
    name: "Artemis",
    query: "artemis launch",
    label: "NOVOS CAMINHOS",
    color: "#F7A18C",
  },
];
