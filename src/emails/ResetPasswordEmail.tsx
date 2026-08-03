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

type ResetPasswordEmailArgs = {
  name?: string;
  url: string;
};

export default function ResetPasswordEmail({
  name,
  url,
}: ResetPasswordEmailArgs) {
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
        <Preview>Qiimale — erey sir cusub</Preview>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="max-w-xl mx-auto bg-white p-8 rounded-lg">
            <Heading className="text-2xl font-bold text-brand mb-4">
              Beddel Password-kaaga
            </Heading>
            <Text className="text-base text-gray-800 mb-4">
              Salaam {name ?? ""}, waxaa la codsaday in ereyga sirta ah ee
              akoonkaaga Qiimale la beddelo. Haddii codsiga uu adiga kaa yimid,
              fadlan guji xiriiriyaha hoose.
            </Text>
            <Button
              href={url}
              className="bg-brand text-white px-6 py-3 rounded-lg block text-center box-border no-underline"
            >
              Beddel ereyga sirta ah
            </Button>
            <Text className="text-base text-gray-800 mt-4">
              Haddii aadan codsan, fadlan iska indhatir iimaylkan.
            </Text>
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

ResetPasswordEmail.PreviewProps = {
  name: "Cabdi",
  url: "https://qiimale.com/reset-password?token=preview-token",
} satisfies ResetPasswordEmailArgs;
