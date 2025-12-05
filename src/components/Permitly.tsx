"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

const PermitlyContext = createContext({ isAllowed: false, isLoading: true });
