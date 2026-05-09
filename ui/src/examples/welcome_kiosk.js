/**
 * @fileoverview Welcome Kiosk example workspace.
 *
 * Basic station guide NPC with sub-menus and informational dialog.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const welcomeKiosk = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "fields": {
          "TEXT": "Welcome to {faction}, {name}! I am {partner}, your station guide.",
          "MS": 2500
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "Tell me about this station."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_say_menu",
                    "fields": {
                      "TEXT": "This is a trading hub run by {faction}.",
                      "MS": 2000
                    },
                    "inputs": {
                      "CHOICES": {
                        "block": {
                          "type": "npc_choice",
                          "fields": {
                            "LABEL": "What can I trade here?"
                          },
                          "inputs": {
                            "ACTIONS": {
                              "block": {
                                "type": "npc_say",
                                "fields": {
                                  "TEXT": "We deal in ore, processed materials and ship components.",
                                  "MS": 2000
                                },
                                "next": {
                                  "block": {
                                    "type": "npc_say",
                                    "fields": {
                                      "TEXT": "Visit the market deck on level 3 for full listings.",
                                      "MS": 2000
                                    }
                                  }
                                }
                              }
                            }
                          },
                          "next": {
                            "block": {
                              "type": "npc_goback",
                              "fields": {
                                "LABEL": "I see, thanks."
                              }
                            }
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
                    "LABEL": "How do I travel between sectors?"
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_say",
                        "fields": {
                          "TEXT": "Use a Jump Drive or the faction portal on level 1.",
                          "MS": 2000
                        },
                        "next": {
                          "block": {
                            "type": "npc_say",
                            "fields": {
                              "TEXT": "Portals are free for faction members. Others pay 5 000 credits.",
                              "MS": 2000
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
                        "LABEL": "What services does the station offer?"
                      },
                      "inputs": {
                        "ACTIONS": {
                          "block": {
                            "type": "npc_say_menu",
                            "fields": {
                              "TEXT": "We offer trade, crew hiring, and mission dispatch.",
                              "MS": 2000
                            },
                            "inputs": {
                              "CHOICES": {
                                "block": {
                                  "type": "npc_choice",
                                  "fields": {
                                    "LABEL": "Trade."
                                  },
                                  "inputs": {
                                    "ACTIONS": {
                                      "block": {
                                        "type": "npc_say",
                                        "fields": {
                                          "TEXT": "The market is on level 3, open 24/7.",
                                          "MS": 2000
                                        }
                                      }
                                    }
                                  },
                                  "next": {
                                    "block": {
                                      "type": "npc_choice",
                                      "fields": {
                                        "LABEL": "Crew hiring."
                                      },
                                      "inputs": {
                                        "ACTIONS": {
                                          "block": {
                                            "type": "npc_say",
                                            "fields": {
                                              "TEXT": "The crew office is on level 2. We hire pilots, engineers and gunners.",
                                              "MS": 2000
                                            }
                                          }
                                        }
                                      },
                                      "next": {
                                        "block": {
                                          "type": "npc_goback",
                                          "fields": {
                                            "LABEL": "Thanks for the info."
                                          }
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
                      "next": {
                        "block": {
                          "type": "npc_goback",
                          "fields": {
                            "LABEL": "Goodbye, {name}."
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
