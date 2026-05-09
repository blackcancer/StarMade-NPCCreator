/**
 * @fileoverview Toll Booth example workspace.
 *
 * Basic credit-gated access NPC with block activation on payment.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const tollBooth = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "fields": {
          "TEXT": "Halt! Access to this zone requires payment of 5 000 credits.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "Pay the toll (5 000 cr)."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_check_credits",
                    "fields": {
                      "AMOUNT": 5000
                    },
                    "inputs": {
                      "THEN": {
                        "block": {
                          "type": "npc_give_credits",
                          "fields": {
                            "AMOUNT": -5000
                          },
                          "next": {
                            "block": {
                              "type": "npc_activate_block",
                              "fields": {
                                "X": 10,
                                "Y": 0,
                                "Z": 5,
                                "STATE": "true"
                              },
                              "next": {
                                "block": {
                                  "type": "npc_say",
                                  "fields": {
                                    "TEXT": "Gate open. You may proceed.",
                                    "MS": 2000
                                  }
                                }
                              }
                            }
                          }
                        }
                      },
                      "ELSE": {
                        "block": {
                          "type": "npc_say",
                          "fields": {
                            "TEXT": "You don't have enough credits. The toll is 5 000 credits.",
                            "MS": 2000
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
                    "LABEL": "Where is the gate exactly?"
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_say",
                        "fields": {
                          "TEXT": "The gate is at coordinates 10, 0, 5. You can't miss it.",
                          "MS": 2000
                        }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "npc_choice",
                      "fields": {
                        "LABEL": "What's beyond the gate?"
                      },
                      "inputs": {
                        "ACTIONS": {
                          "block": {
                            "type": "npc_say",
                            "fields": {
                              "TEXT": "The restricted research lab. Authorised personnel only.",
                              "MS": 2000
                            }
                          }
                        }
                      },
                      "next": {
                        "block": {
                          "type": "npc_goback",
                          "fields": {
                            "LABEL": "Farewell."
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "x": 30,
        "y": 30
      }
    ]
  }
};
