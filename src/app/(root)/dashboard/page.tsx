'use client'

import { useState } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Text,
  VStack,
  Card,
  SimpleGrid,
  Spinner,
  Field
} from '@chakra-ui/react'
import {Tooltip} from "@/components/ui/tooltip";
import {toaster} from "@/components/ui/toaster";

export default function DashboardPage() {
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [inputLength, setInputLength] = useState(0)

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Limit input to a maximum of 11 characters
    if (value.length <= 11) {
      setInputValue(value)
      setInputLength(value.length)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (inputLength !== 11) {
      toaster.create({
        title: 'Invalid input',
        description: 'Please enter exactly 11 characters',
        duration: 5000,
      })
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/multi-search', {
        searchTerm: inputValue
      })

      setResults(response.data)

      toaster.create({
        title: `Search complete`,
        description: 'Search results have been loaded',
        type: 'success',
        duration: 3000,
        closable: true,
      })

    } catch (error) {
      console.error('Error submitting form:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to fetch results. Please try again.',
        duration: 5000,
        closable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack gap={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4}>Multi-API Search</Heading>
          <Text color="gray.600">
            Enter your search term (exactly 11 characters) to search across multiple APIs
          </Text>
        </Box>

        <Box as="form" onSubmit={handleSubmit} bg="white" shadow="md" borderRadius="lg" p={6}>
          <Field.Root mb={4}>
            <Field.Label>
              Search Term
              <Tooltip showArrow content="Enter exactly 11 characters" positioning={{placement: "top"}}>
                <Text as="span" ml={1} color="blue.500" cursor="help">
                  ℹ️
                </Text>
              </Tooltip>
              <Field.RequiredIndicator />
            </Field.Label>
            <Box position="relative">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter exactly 11 characters"
                maxLength={11}
                invalid={inputLength > 0 && inputLength !== 11}
              />
              <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)">
                <Text fontSize="xs" color={inputLength === 11 ? 'green.500' : 'gray.500'}>
                  {inputLength}/11
                </Text>
              </Box>
            </Box>
          </Field.Root>

          <Button
            colorPalette="blue"
            loading={loading}
            loadingText="Searching..."
            type="submit"
            width="full"
            disabled={inputLength !== 11}
          >
            Search
          </Button>
        </Box>

        {loading && (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" color="blue.500" />
            <Text mt={4}>Searching across multiple APIs...</Text>
          </Box>
        )}

        {results && !loading && (
          <Box>
            <Heading size="md" mb={4}>Search Results</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {Object.entries(results).map(([apiName, apiResult]: [string, any]) => (
                <Card.Root key={apiName}>
                  <Card.Header bg="blue.50" borderTopRadius="lg">
                    <Heading size="sm">{apiName}</Heading>
                  </Card.Header>
                  <Card.Body>
                    <Box maxH="300px" overflowY="auto">
                      <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(apiResult, null, 2)}
                      </pre>
                    </Box>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    </Container>
  )
}
