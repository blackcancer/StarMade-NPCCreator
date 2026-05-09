/**
 * @fileoverview Quest giver example workspace.
 *
 * Quest offer and completion flow using persistent quest state.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const questGiver = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "x": 30,
        "y": 30,
        "fields": {
          "TEXT": "Greetings {name}! I have a mission for you.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "Tell me about the mission."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_quest_offer",
                    "fields": {
                      "QUEST_ID": "guild_delivery",
                      "TITLE": "Guild Delivery",
                      "OFFER_TEXT": "Deliver a message to Waldo. Will you take it?",
                      "ACCEPT_LABEL": "Yes, I'll do it!",
                      "REFUSE_LABEL": "Not now.",
                      "ACCEPT_TEXT": "Thank you! Come back once you've found him.",
                      "REFUSE_TEXT": "Come back if you change your mind.",
                      "STEP": 1
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "npc_choice",
                  "fields": {
                    "LABEL": "I've found Waldo."
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_quest_complete",
                        "fields": {
                          "QUEST_ID": "guild_delivery",
                          "REWARD_CREDITS": 50000,
                          "REWARD_ITEM": 0,
                          "REWARD_COUNT": 0,
                          "SUCCESS": "Excellent work! Here are your 50 000 credits."
                        }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "npc_goback",
                      "fields": {
                        "LABEL": "Goodbye."
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  }
};
