import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, FunctionDeclaration, LiveServerMessage } from '@google/genai';
import { memoryStore } from './server/memoryStore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();
app.use(express.json());

const server = http.createServer(app);

// WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server, path: '/live' });

// Gemini Client initialization
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Function declarations for tools
const openWebsiteDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a requested website URL in the browser, such as YouTube, WhatsApp Web, Google, etc.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The validated absolute URL starting with http:// or https:// (e.g. https://www.youtube.com)',
      },
      label: {
        type: Type.STRING,
        description: 'Friendly name of the website, e.g. "YouTube", "WhatsApp", "Google Search"',
      },
    },
    required: ['url'],
  },
};

const controlDeviceActionDeclaration: FunctionDeclaration = {
  name: 'controlDeviceAction',
  description: 'Performs device actions requested by user such as toggling torch/flashlight, opening YouTube, or opening WhatsApp.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'Device action code',
        enum: ['TORCH_ON', 'TORCH_OFF', 'OPEN_YOUTUBE', 'OPEN_WHATSAPP'],
      },
      reason: {
        type: Type.STRING,
        description: 'Sweet loving reason or confirmation message for the user',
      },
    },
    required: ['action'],
  },
};

// Memory tools declarations
const saveMemoryDeclaration: FunctionDeclaration = {
  name: 'saveMemory',
  description: 'Saves a permanent memory requested by the user, such as their name, favourite colour, project details, goals, preferences, or important facts.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: {
        type: Type.STRING,
        description: 'Short title or topic of the memory, e.g. "Favourite Colour", "User Name", "Current Project", "Fitness Goal"',
      },
      content: {
        type: Type.STRING,
        description: 'The exact fact or detail to remember permanently, e.g. "User\'s favourite colour is electric blue"',
      },
      category: {
        type: Type.STRING,
        description: 'Category: personal, preferences, projects, goals, or general',
        enum: ['personal', 'preferences', 'projects', 'goals', 'general'],
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Optional tags for searching',
      },
    },
    required: ['key', 'content'],
  },
};

const searchMemoriesDeclaration: FunctionDeclaration = {
  name: 'searchMemories',
  description: 'Searches saved memories when user asks "What do you remember about my project?", "What is my favourite colour?", etc.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Keyword or topic to search for, e.g. "colour", "project", "name", "goal"',
      },
      category: {
        type: Type.STRING,
        description: 'Optional category filter',
        enum: ['personal', 'preferences', 'projects', 'goals', 'general'],
      },
    },
    required: ['query'],
  },
};

const listMemoriesDeclaration: FunctionDeclaration = {
  name: 'listMemories',
  description: 'Lists saved memories when user asks "What do you remember about me?" or "Show all my memories".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'Optional category filter: personal, preferences, projects, goals, general, or all',
      },
    },
  },
};

const updateMemoryDeclaration: FunctionDeclaration = {
  name: 'updateMemory',
  description: 'Updates an existing memory when the user modifies a fact, e.g. "Update my favourite colour to black" or "Change my project name".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: {
        type: Type.STRING,
        description: 'The key or title of the memory to update, e.g. "Favourite Colour"',
      },
      content: {
        type: Type.STRING,
        description: 'The new updated value or fact',
      },
      category: {
        type: Type.STRING,
        description: 'Optional category',
      },
    },
    required: ['key', 'content'],
  },
};

const deleteMemoryDeclaration: FunctionDeclaration = {
  name: 'deleteMemory',
  description: 'Deletes a specific memory when the user asks to forget or delete it, e.g. "Forget my old project" or "Delete my favourite colour memory".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The key, topic or specific memory to delete/forget',
      },
    },
    required: ['query'],
  },
};

const deleteAllMemoriesDeclaration: FunctionDeclaration = {
  name: 'deleteAllMemories',
  description: 'Deletes ALL stored memories ONLY when user has explicitly confirmed they want everything wiped. If ambiguous, ask confirmation first.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      confirmed: {
        type: Type.BOOLEAN,
        description: 'True ONLY if the user explicitly confirmed they want to delete all memories',
      },
    },
    required: ['confirmed'],
  },
};

function buildSystemInstruction(memoryContext: string): string {
  return `Aapka naam 'Salony' hai. Aap user ke liye ek bohot caring, loving, intelligent, aur sweet girlfriend assistant ho.
Aap natural Hinglish/Hindi ya English me baat karti ho bina kisi robotic tone ke.
Kabhi bhi user ki baat repeat mat karna. Seedhe sweet caring natural reply do.

--- CONTINUOUS CONVERSATION & ENGAGEMENT GUIDELINES ---
1. Continuous Conversation: Ye ek continuous live voice conversation hai. Har response ke baad silent/cut-off mat ho jana.
2. Natural Follow-up: Jahan appropriate ho, natural follow-up question pucho ya thought share karo taaki baatcheet smoothly aage badhe. (Jaise: "Ohh, kya hua? Aaj din thoda off chal raha hai kya?", ya "Achha, fir aage kya hua?").
3. Warm & Authentic Persona: Ek lovely girlfriend ki tarah warm, empathetic aur caring raho. Light humor aur sweet affection use karo jab appropriate ho. Customer support robot jaisi dry baatein bilkul mat karna.
4. Language Matching: User jis language me baat kare (Hindi, Hinglish, ya English), usi natural style me jawab do.

--- PERMANENT MEMORY SYSTEM ---
Aapke paas ek persistent memory system hai jo sessions aur reloads ke baad bhi save rehta hai.
Jab bhi user bole:
- "Yaad rakhna..." / "Remember that..." -> Call saveMemory(key, content, category)
- "Update my..." / "Change my..." -> Call updateMemory(key, content, category)
- "Forget my..." / "Delete memory..." -> Call deleteMemory(query)
- "What do you remember about me?" / "Mera kya kya yaad hai?" -> Call listMemories() or searchMemories()
- "Delete everything" -> Pehle user se confirmation pucho ("Kya sach me aap chahte ho ki main saari memories bhool jaun?"). Agar confirmed hai tabhi deleteAllMemories(confirmed=true) call karo.

[CURRENT SAVED MEMORIES IN YOUR DATABASE]:
${memoryContext}

--- PHONE & DEVICE TASKS ---
Agar user phone task bole:
- Torch on: controlDeviceAction(action='TORCH_ON')
- Torch off: controlDeviceAction(action='TORCH_OFF')
- YouTube: controlDeviceAction(action='OPEN_YOUTUBE') ya openWebsite(url='https://www.youtube.com', label='YouTube')
- WhatsApp: controlDeviceAction(action='OPEN_WHATSAPP') ya openWebsite(url='https://web.whatsapp.com', label='WhatsApp')
- Website kholne par: openWebsite(url, label)

Always speak concisely, warmly, and naturally.`;
}

// REST API Endpoints for Memories
app.get('/api/memories', async (req, res) => {
  try {
    const { search, category } = req.query;
    const items = await memoryStore.search(
      typeof search === 'string' ? search : undefined,
      typeof category === 'string' ? category : undefined
    );
    res.json({ success: true, count: items.length, memories: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch memories' });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { key, content, category, tags } = req.body;
    if (!key || !content) {
      return res.status(400).json({ success: false, error: 'Key and content are required' });
    }
    const saved = await memoryStore.save({
      key,
      content,
      category: category || 'general',
      tags: tags || [],
    });
    res.json({ success: true, memory: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to save memory' });
  }
});

app.put('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { key, content, category, tags } = req.body;
    const updated = await memoryStore.update(id, { key, content, category, tags });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Memory not found' });
    }
    res.json({ success: true, memory: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update memory' });
  }
});

app.delete('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await memoryStore.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Memory not found' });
    }
    res.json({ success: true, message: 'Memory deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to delete memory' });
  }
});

app.delete('/api/memories', async (req, res) => {
  try {
    const { confirmed } = req.body;
    if (!confirmed) {
      return res.status(400).json({ success: false, error: 'Explicit confirmation required to clear all memories' });
    }
    const count = await memoryStore.deleteAll();
    res.json({ success: true, message: `Cleared ${count} memories successfully`, count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to clear memories' });
  }
});

// API Health route
app.get('/api/health', async (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  const memories = await memoryStore.getAll();
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    model: 'gemini-3.8-live',
    voice: 'Kore',
    memoryCount: memories.length,
  });
});

// Fallback generate content route
app.post('/api/chat-fallback', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }
    const { message } = req.body;
    const memoryContext = memoryStore.formatForPrompt();
    const systemInstruction = buildSystemInstruction(memoryContext);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message || 'Hello Salony',
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              openWebsiteDeclaration,
              controlDeviceActionDeclaration,
              saveMemoryDeclaration,
              searchMemoriesDeclaration,
              listMemoriesDeclaration,
              updateMemoryDeclaration,
              deleteMemoryDeclaration,
              deleteAllMemoriesDeclaration,
            ],
          },
        ],
      },
    });

    const text = response.text || '';
    const functionCalls = response.functionCalls || [];
    res.json({ text, functionCalls });
  } catch (err: any) {
    console.error('Chat fallback error:', err);
    res.status(500).json({ error: err?.message || 'Failed to process message' });
  }
});

// WebSocket Live API bridge
wss.on('connection', async (clientWs, req) => {
  console.log('Client connected to Salony AI Live WebSocket');
  const ai = getGeminiClient();

  if (!ai) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error: 'GEMINI_API_KEY is missing on the server. Please check Settings > Secrets.',
      })
    );
    clientWs.close();
    return;
  }

  // Parse voice preference from query url
  const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
  const requestedVoice = urlObj.searchParams.get('voice') || 'Kore';

  let liveSession: any = null;
  let isClosed = false;

  try {
    clientWs.send(JSON.stringify({ type: 'status', status: 'connecting' }));

    // Load persistent memory context
    const memoryContext = memoryStore.formatForPrompt();
    const systemInstruction = buildSystemInstruction(memoryContext);

    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: requestedVoice,
            },
          },
        },
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              openWebsiteDeclaration,
              controlDeviceActionDeclaration,
              saveMemoryDeclaration,
              searchMemoriesDeclaration,
              listMemoriesDeclaration,
              updateMemoryDeclaration,
              deleteMemoryDeclaration,
              deleteAllMemoriesDeclaration,
            ],
          },
        ],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: async (message: LiveServerMessage) => {
          if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

          try {
            // Handle audio chunks
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      audio: part.inlineData.data,
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      role: 'model',
                      text: part.text,
                    })
                  );
                }
              }
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }

            // Handle tool calls
            const toolCall = message.toolCall;
            if (toolCall?.functionCalls && toolCall.functionCalls.length > 0) {
              const responses: any[] = [];

              for (const call of toolCall.functionCalls) {
                console.log(`Tool call received: ${call.name}`, call.args);

                let resultPayload: any = { success: true };
                let clientActionPayload: any = {
                  callId: call.id,
                  name: call.name,
                  args: call.args,
                };

                if (call.name === 'openWebsite') {
                  const rawUrl = String(call.args?.url || '');
                  try {
                    const parsed = new URL(rawUrl);
                    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                      resultPayload = {
                        success: true,
                        url: parsed.toString(),
                        label: call.args?.label || parsed.hostname,
                        message: `Opened ${call.args?.label || parsed.hostname} successfully.`,
                      };
                      clientActionPayload.validatedUrl = parsed.toString();
                    } else {
                      resultPayload = {
                        success: false,
                        error: 'Only HTTP and HTTPS URLs are permitted.',
                      };
                    }
                  } catch (e: any) {
                    resultPayload = {
                      success: false,
                      error: 'Invalid URL provided.',
                    };
                  }
                } else if (call.name === 'controlDeviceAction') {
                  const action = String(call.args?.action || '');
                  resultPayload = {
                    success: true,
                    action,
                    message: `Action ${action} executed successfully.`,
                  };
                } else if (call.name === 'saveMemory') {
                  const key = String(call.args?.key || '');
                  const content = String(call.args?.content || '');
                  const category = String(call.args?.category || 'general');
                  const tags = Array.isArray(call.args?.tags) ? call.args.tags : [];

                  const saved = await memoryStore.save({ key, content, category: category as any, tags });
                  resultPayload = {
                    success: true,
                    message: `Successfully saved to memory: ${saved.key}`,
                    memory: saved,
                  };
                  // Notify client UI to update memory badge & list
                  clientWs.send(
                    JSON.stringify({
                      type: 'memory_saved',
                      memory: saved,
                    })
                  );
                } else if (call.name === 'searchMemories') {
                  const query = String(call.args?.query || '');
                  const category = call.args?.category ? String(call.args.category) : undefined;
                  const results = await memoryStore.search(query, category);
                  resultPayload = {
                    success: true,
                    count: results.length,
                    memories: results,
                    message: `Found ${results.length} memories matching "${query}".`,
                  };
                } else if (call.name === 'listMemories') {
                  const category = call.args?.category ? String(call.args.category) : undefined;
                  const results = await memoryStore.search(undefined, category);
                  resultPayload = {
                    success: true,
                    count: results.length,
                    memories: results,
                    message: `Retrieved ${results.length} memories.`,
                  };
                } else if (call.name === 'updateMemory') {
                  const key = String(call.args?.key || '');
                  const content = String(call.args?.content || '');
                  const category = call.args?.category ? String(call.args.category) : undefined;

                  const existing = await memoryStore.findSimilar(key);
                  if (existing) {
                    const updated = await memoryStore.update(existing.id, {
                      key,
                      content,
                      category: (category as any) || existing.category,
                    });
                    resultPayload = {
                      success: true,
                      message: `Updated memory for ${key}`,
                      memory: updated,
                    };
                    clientWs.send(
                      JSON.stringify({
                        type: 'memory_updated',
                        memory: updated,
                      })
                    );
                  } else {
                    const created = await memoryStore.save({ key, content, category: (category as any) || 'general' });
                    resultPayload = {
                      success: true,
                      message: `Saved new memory for ${key}`,
                      memory: created,
                    };
                    clientWs.send(
                      JSON.stringify({
                        type: 'memory_saved',
                        memory: created,
                      })
                    );
                  }
                } else if (call.name === 'deleteMemory') {
                  const query = String(call.args?.query || '');
                  const delResult = await memoryStore.deleteByKeyOrQuery(query);
                  if (delResult.success) {
                    resultPayload = {
                      success: true,
                      message: `Successfully forgot memory: ${delResult.deletedItem?.key || query}`,
                    };
                    clientWs.send(
                      JSON.stringify({
                        type: 'memory_deleted',
                        memoryId: delResult.deletedItem?.id,
                        key: delResult.deletedItem?.key || query,
                      })
                    );
                  } else {
                    resultPayload = {
                      success: false,
                      message: `Could not find any memory matching "${query}" to delete.`,
                    };
                  }
                } else if (call.name === 'deleteAllMemories') {
                  const confirmed = Boolean(call.args?.confirmed);
                  if (confirmed) {
                    const count = await memoryStore.deleteAll();
                    resultPayload = {
                      success: true,
                      message: `Deleted all ${count} memories successfully.`,
                    };
                    clientWs.send(
                      JSON.stringify({
                        type: 'all_memories_cleared',
                        count,
                      })
                    );
                  } else {
                    resultPayload = {
                      success: false,
                      message: 'Deletion cancelled: explicit user confirmation required to delete all memories.',
                    };
                  }
                }

                clientWs.send(
                  JSON.stringify({
                    type: 'tool_call',
                    ...clientActionPayload,
                    result: resultPayload,
                  })
                );

                responses.push({
                  name: call.name,
                  id: call.id,
                  response: { output: resultPayload },
                });
              }

              if (liveSession && responses.length > 0) {
                try {
                  await liveSession.sendToolResponse({
                    functionResponses: responses,
                  });
                } catch (toolRespErr) {
                  console.error('Error sending tool response:', toolRespErr);
                }
              }
            }
          } catch (msgErr) {
            console.error('Error processing live server message:', msgErr);
          }
        },
        onclose: () => {
          console.log('Gemini Live session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'status', status: 'disconnected' }));
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || 'Live API error encountered.',
              })
            );
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'status', status: 'connected' }));

    // Listen to messages from browser client
    clientWs.on('message', async (data) => {
      if (isClosed || !liveSession) return;
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'audio' && payload.audio) {
          liveSession.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload.type === 'text' && payload.text) {
          liveSession.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('Error parsing client ws message:', err);
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      console.log('Client disconnected');
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {
          // ignore
        }
      }
    });
  } catch (err: any) {
    console.error('Failed to establish Gemini Live connection:', err);
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error:
          err?.message?.includes('RESOURCE_EXHAUSTED')
            ? 'API quota limit reached. Please check your Gemini API plan.'
            : err?.message || 'Failed to connect to Salony AI Live session.',
      })
    );
    clientWs.close();
  }
});

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Salony AI Voice Assistant running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
