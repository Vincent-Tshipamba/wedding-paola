// Single source of truth for the couple's page.
// Later this will come from the database / admin. Replace every TODO.
export type WeddingEvent = {
  id: string;
  title: string;
  date: string; // ISO, local time of the venue
  venue: string;
  address: string;
  description: string;
};

export const wedding = {
  hashtag: "#AzariasEtPaola",
  city: "Kinshasa", // TODO
  couple: {
    bride: {
      firstName: "Paola",
      lastName: "Odimba",
      bio: "TODO: a few warm lines about Paola.",
      photo: "/couple/paola2.jpeg",
    },
    groom: {
      firstName: "Azarias",
      lastName: "Mbiye",
      bio: "TODO: a few warm lines about Azarias.",
      photo: "/couple/azaria.jpeg", // e.g. "/couple/azarias.jpg"
    },
  },
  story: [
    {
      year: "TODO",
      title: "The first meeting",
      text: "TODO: how it all began.",
    },
    {
      year: "TODO",
      title: "The first 'I love you'",
      text: "TODO: a memory to share.",
    },
    {
      year: "TODO",
      title: "The proposal",
      text: "TODO: the question, the answer.",
    },
  ],
  events: [
    {
      id: "customary",
      date: "2027-01-24T10:00:00+01:00",
      venue: "Résidence de la famille Odimba",
      address: "Avenue des Acacias, Ngaliema, Kinshasa",
    },
    {
      id: "civil",
      date: "2027-01-30T10:00:00+01:00",
      venue: "Maison communale de la Gombe",
      address: "Avenue de la Mission, Gombe, Kinshasa",
    },
    {
      id: "talk",
      date: "2027-01-31T13:00:00+01:00",
      venue: "Salle du Royaume de Tshiela",
      address: "Avenue Tshela, Croisement Rue Kasavubu, Kinshasa",
    },
    {
      id: "party",
      date: "2027-01-31T19:30:00+01:00",
      venue: "Salle de fête Le Prestige",
      address: "Avenue du Commerce, Gombe, Kinshasa",
    },
  ],
  storyIds: ["meeting", "love", "proposal", "forever"],
  couplePhoto: "/couple/together.jpeg",
  gallery: [
    {
      src: "/gallery/1.jpeg",
      alt: "Paola and Azarias, photo 1",
    },
    {
      src: "/gallery/2.jpeg",
      alt: "Paola and Azarias, photo 2",
    },
    {
      src: "/gallery/3.jpeg",
      alt: "Paola and Azarias, photo 3",
    },
    {
      src: "/gallery/4.jpeg",
      alt: "Paola and Azarias, photo 4",
    },
    {
      src: "/gallery/5.jpeg",
      alt: "Paola and Azarias, photo 5",
    },
    {
      src: "/gallery/6.jpeg",
      alt: "Paola and Azarias, photo 6",
    },
    {
      src: "/gallery/7.jpeg",
      alt: "Paola and Azarias, photo 7",
    },
    {
      src: "/gallery/8.jpeg",
      alt: "Paola and Azarias, photo 8",
    },
    {
      src: "/gallery/9.jpeg",
      alt: "Paola and Azarias, photo 9",
    },
    {
      src: "/gallery/10.jpeg",
      alt: "Paola and Azarias, photo 10",
    },
    {
      src: "/gallery/11.jpeg",
      alt: "Paola and Azarias, photo 11",
    },
    {
      src: "/gallery/12.jpeg",
      alt: "Paola and Azarias, photo 12",
    },
  ] as { src: string; alt: string }[], // e.g. [{ src: "/gallery/1.jpg", alt: "Paola and Azarias, photo 1" }]
};

export const mainDate = wedding.events[0].date;
export const lastDate = wedding.events[wedding.events.length - 1].date;
