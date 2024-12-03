import OpenAI from "openai";

export const vision = async ({text, imageUrl}: {text: string, imageUrl: string}) => {
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text },
          {
            type: "image_url",
            image_url: {
              "url": imageUrl,
            },
          },
        ],
      },
    ],
  });
  
  return response.choices[0].message.content;
}
