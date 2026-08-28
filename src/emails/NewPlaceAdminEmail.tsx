import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  pixelBasedPreset,
  Tailwind,
  Text,
} from "react-email";

interface NewPlaceAdminEmailArgs {
  placeName?: string;
  cityName?: string;
  categoryName?: string;
  submitterEmail?: string;
  url: string;
}

export default function NewPlaceAdminEmail({
  placeName,
  cityName,
  categoryName,
  submitterEmail,
  url,
}: NewPlaceAdminEmailArgs) {
  return (
    <Html lang="so" dir="ltr">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: "#4f46e5",
              },
            },
          },
        }}
      >
        <Head />
        <Preview>Goob cusub ayaa la sameeyay — Qiimale</Preview>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="max-w-xl mx-auto bg-white p-8 rounded-lg">
            <Heading className="text-2xl font-bold text-brand mb-4">
              Goob cusub ayaa la sameeyay
            </Heading>
            <Text className="text-gray-700 mb-2">
              Goob cusub oo loo soo gudbiyay ayaa u baahan Aqbalid ama diidmo:
            </Text>
            <Text className="text-gray-900 font-bold mb-1">{placeName}</Text>
            <Text className="text-gray-600 mb-1">Magaalo: {cityName}</Text>
            <Text className="text-gray-600 mb-1">Qaybta: {categoryName}</Text>
            {submitterEmail ? (
              <Text className="text-gray-600 mb-1">
                Waxaa Soo gudbiyay: {submitterEmail}
              </Text>
            ) : null}
            <Button
              href={url}
              className="bg-brand text-white px-6 py-3 rounded-lg font-bold mt-4 inline-block"
            >
              Furo bogga maamulka
            </Button>
            <Text className="text-gray-500 text-sm mt-6">
              Hadii aad furi weydo linkiga, koobiyee URL-kan: {url}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
