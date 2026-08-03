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

interface VerifyEmailArgs {
  name?: string;
  url: string;
}

export default function VerifyEmail({ name, url }: VerifyEmailArgs) {
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
        <Preview>Xaqiiji iimaylkaaga Qiimale</Preview>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="max-w-xl mx-auto bg-white p-8 rounded-lg">
            <Heading className="text-2xl font-bold text-brand mb-4">
              Xaqiiji iimaylkaaga
            </Heading>
            <Text className="text-base text-gray-800 mb-4">
              Salaam {name ?? ""}, fadlan guji badhanka hoose si aad u xaqiijiso
              iimaylkaaga Qiimale.
            </Text>
            <Text className="text-base text-gray-800 mb-6">
              Haddii aadan codsan inaad akoon abuurto, fadlan iska indhatir
              iimaylkan.
            </Text>
            <Button
              href={url}
              className="bg-brand text-white px-6 py-3 rounded-lg block text-center box-border no-underline"
            >
              Xaqiiji iimaylkaaga
            </Button>
            <Text className="text-xs text-gray-500 break-all mt-6">
              Haddii badhanku shaqeyn waayo, Guji linkigan ama koobiyee oo ku
              fur browser-ka: {url}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

VerifyEmail.PreviewProps = {
  name: "Cabdi",
  url: "https://qiimale.com/verify?token=preview-token",
} satisfies VerifyEmailArgs;
