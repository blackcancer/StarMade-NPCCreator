/**
 * @fileoverview Crew Recruiter example workspace.
 *
 * Intermediate crew management NPC: hire, dismiss, spawn, confirm dialog, reputation.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const crewRecruiter = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "fields": {
          "TEXT": "Greetings, {name}! I'm {partner}, crew recruitment officer for {faction}.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "I'd like to hire you (50 000 cr)."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_hire",
                    "fields": {
                      "PRICE": 50000
                    },
                    "inputs": {
                      "HIRED": {
                        "block": {
                          "type": "npc_rep_add",
                          "fields": {
                            "NPC_ID": "trading_guild",
                            "DELTA": 5
                          },
                          "next": {
                            "block": {
                              "type": "npc_send_message",
                              "fields": {
                                "TYPE": "info",
                                "TEXT": "Welcome aboard, Commander! Your crew now has a new member."
                              }
                            }
                          }
                        }
                      },
                      "CREW_FULL": {
                        "block": {
                          "type": "npc_say",
                          "fields": {
                            "TEXT": "Your crew is already full. Dismiss someone first.",
                            "MS": 2000
                          }
                        }
                      },
                      "REFUSED": {
                        "block": {
                          "type": "npc_say",
                          "fields": {
                            "TEXT": "We cannot serve different factions, Commander.",
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
                    "LABEL": "Dismiss you from my crew."
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_confirm",
                        "fields": {
                          "TEXT": "Are you sure you want to dismiss this crew member?",
                          "MS": 2500,
                          "YES_LABEL": "Yes, dismiss.",
                          "NO_LABEL": "No, keep them."
                        },
                        "inputs": {
                          "YES": {
                            "block": {
                              "type": "npc_unhire",
                              "inputs": {
                                "SUCCESS": {
                                  "block": {
                                    "type": "npc_send_message",
                                    "fields": {
                                      "TYPE": "info",
                                      "TEXT": "Crew member dismissed. Farewell."
                                    }
                                  }
                                },
                                "FAIL": {
                                  "block": {
                                    "type": "npc_say",
                                    "fields": {
                                      "TEXT": "This crew member is not assigned to your crew.",
                                      "MS": 2000
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
                      "type": "npc_choice",
                      "fields": {
                        "LABEL": "Spawn additional crew (25 000 cr)."
                      },
                      "inputs": {
                        "ACTIONS": {
                          "block": {
                            "type": "npc_spawn_crew",
                            "fields": {
                              "PRICE": 25000
                            },
                            "inputs": {
                              "SUCCESS": {
                                "block": {
                                  "type": "npc_say",
                                  "fields": {
                                    "TEXT": "New crew member dispatched to your ship.",
                                    "MS": 2000
                                  }
                                }
                              },
                              "NO_CREDITS": {
                                "block": {
                                  "type": "npc_say",
                                  "fields": {
                                    "TEXT": "You don't have 25 000 credits for this.",
                                    "MS": 2000
                                  }
                                }
                              },
                              "CREW_FULL": {
                                "block": {
                                  "type": "npc_say",
                                  "fields": {
                                    "TEXT": "Your crew complement is full.",
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
                            "LABEL": "What's my current reputation?"
                          },
                          "inputs": {
                            "ACTIONS": {
                              "block": {
                                "type": "npc_get_rep",
                                "fields": {
                                  "NPC_ID": "trading_guild",
                                  "TEXT": "Your guild standing: %s reputation points."
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
            }
          }
        },
        "x": 30,
        "y": 30
      }
    ]
  }
};
