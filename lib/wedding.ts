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
  hashtag: "#PaolaEtAzarias",
  city: "Kinshasa", // TODO
  couple: {
    bride: {
      firstName: "Paola",
      lastName: "Odimba",
      bio: "TODO: a few warm lines about Paola.",
      photo: "/gallery/paola.jpg", // e.g. "/gallery/paola.jpg"
    },
    groom: {
      firstName: "Azarias",
      lastName: "Lubobo",
      bio: "TODO: a few warm lines about Azarias.",
      photo: "/gallery/azarias.jpg", // e.g. "/gallery/azarias.jpg"
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
      venue: "TODO venue",
      address: "TODO address",
      description:
        "Dinner, music and dancing. Guests are admitted with their QR code.",
    },
    {
      id: "civil",
      date: "2027-01-31T10:00:00+01:00",
      venue: "TODO venue",
      address: "TODO address",
      description: "The official union, with close family and friends.",
    },
    {
      id: "religious",
      date: "2027-01-31T13:00:00+01:00",
      venue: "TODO venue",
      address: "TODO address",
      description: "Exchange of vows and blessing.",
    },
  ],
  storyIds: ["meeting", "love", "proposal"],
  gallery: [
    {
      src: "/gallery/1.jpg",
      alt: "Paola and Azarias, photo 1",
    },
    {
      src: "/gallery/2.jpg",
      alt: "Paola and Azarias, photo 2",
    },
    {
      src: "/gallery/3.jpg",
      alt: "Paola and Azarias, photo 3",
    },
    {
      src: "/gallery/4.jpg",
      alt: "Paola and Azarias, photo 4",
    },
  ] as { src: string; alt: string }[], // e.g. [{ src: "/gallery/1.jpg", alt: "Paola and Azarias, photo 1" }]
};

export const mainDate = wedding.events[0].date;
export const lastDate = wedding.events[wedding.events.length - 1].date;