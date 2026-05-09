/**
 * @fileoverview Inventory quest example workspace.
 *
 * Take-item branch that rewards credits when requirements are met.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const inventoryQuest = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "x": 30,
        "y": 30,
        "fields": {
          "TEXT": "Greetings {name}! Do you have the ore samples I requested?",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "Yes, here are the 5 ore samples."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_take_item",
                    "fields": {
                      "ITEM_TYPE": 62,
                      "COUNT": 5
                    },
                    "inputs": {
                      "THEN": {
                        "block": {
                          "type": "npc_give_credits",
                          "fields": {
                            "AMOUNT": 25000,
                            "SUCCESS": "Credits transferred. Well done!"
                          }
                        }
                      },
                      "ELSE": {
                        "block": {
                          "type": "npc_send_message",
                          "fields": {
                            "TYPE": "warn",
                            "TEXT": "You need 5x Fatanium Ore (item 62)."
                          }
                        }
                      }
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "npc_choice",
                  "fields": {
                    "LABEL": "I need more time."
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_send_message",
                        "fields": {
                          "TYPE": "info",
                          "TEXT": "Bring 5x Fatanium Ore (item type 62)."
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
