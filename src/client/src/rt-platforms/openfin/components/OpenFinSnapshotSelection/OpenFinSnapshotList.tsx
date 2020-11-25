import React, {
  KeyboardEventHandler,
  SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  Button,
  CloseButton,
  ErrorAlert,
  FormControl,
  HrBar,
  Root,
  StatusCircle,
  TextInput,
  TextInputLabel,
  SnapshotList,
  SnapshotListTitle,
  SnapshotName,
  SnapshotReset,
  SnapshotRoot,
  Background,
} from './styled'
import { Flex, Modal } from 'rt-components'
import { SnapshotActiveStatus } from 'rt-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import {
  applySnapshotFromStorage,
  getCurrentSnapshotName,
  getSnapshotNames,
  saveSnapshotToStorage,
} from './utils'
import { createOpenFinPopup, Offset, showOpenFinPopup } from '../utils'

type SnapshotError = {
  message: string
  topic: 'save' | 'load'
}

const OpenFinSnapshotList: React.FC = props => {
  const [isLoading, setIsLoading] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [newSnapshotName, setNewSnapshotName] = useState<string>('')
  const [snapshotError, setSnapshotError] = useState<SnapshotError>()

  //region Callbacks

  const toggleOpen = useCallback(
    async (event: SyntheticEvent) => {
      const isAppUrl = (element: any) => element instanceof HTMLInputElement
      if (!isAppUrl(event.target) && !isLoading && !isSaving) {
        const currWin = await fin.Window.getCurrent()
        const views = await currWin.getCurrentViews()
        if (isOpen) {
          views.forEach(v => v.show())
          setNewSnapshotName('')
          setSnapshotError(undefined)
        } else {
          views.forEach(v => v.hide())
        }
        setIsOpen(!isOpen)
      }
    },
    [isLoading, isOpen, isSaving]
  )

  const textInputRef = useCallback((node: any) => {
    if (!!node) {
      node.addEventListener('focus', () => setSnapshotError(undefined))
    }
  }, [])

  //endregion

  //region Effects

  useEffect(() => {
    if (isSaving && newSnapshotName) {
      saveSnapshotToStorage(newSnapshotName)
        .then(() => {
          setSnapshotError(undefined)
          setNewSnapshotName('')
          setIsSaving(false)
        })
        .catch((ex: Error) => {
          console.error(ex)
          setSnapshotError({ topic: 'save', message: 'Failed to take snapshot.' })
          setIsSaving(false)
        })
    }
  }, [isSaving, newSnapshotName])

  useEffect(() => {
    if (isLoading) {
      applySnapshotFromStorage(isLoading)
        .then(() => {
          setSnapshotError(undefined)
          setNewSnapshotName('')
          setIsLoading('')
        })
        .catch((ex: Error) => {
          console.error(ex)
          setSnapshotError({ topic: 'load', message: `Failed to load snapshot ${isLoading}.` })
          setIsLoading('')
        })
    }
  }, [isLoading])

  //endregion

  //region Handlers

  const snapshotListContent = () => {
    const currentSnapshotName = getCurrentSnapshotName()
    const snapshotNames = getSnapshotNames()
    if (snapshotNames.length) {
      return snapshotNames.sort().map((snapshotName: string, idx: number) => {
        const isActive = snapshotName === currentSnapshotName
        return (
          <SnapshotRoot
            key={`snapshot_${idx}`}
            isActive={isActive}
            onClick={e => selectSnapshot(snapshotName)}
          >
            <StatusCircle
              status={isActive ? SnapshotActiveStatus.ACTIVE : SnapshotActiveStatus.INACTIVE}
            />
            <SnapshotName isActive={isActive}>
              {snapshotName}
              <SnapshotReset>(Reset)</SnapshotReset>
            </SnapshotName>
          </SnapshotRoot>
        )
      })
    } else {
      return <SnapshotRoot isActive={true}>No saved snapshots.</SnapshotRoot>
    }
  }

  const selectSnapshot = (snapshotName: string) => {
    setIsLoading(snapshotName)
  }

  const handleSnapshotSubmission: KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Enter' && !!newSnapshotName && !getSnapshotNames().includes(newSnapshotName)) {
      window.alert('i am KAZAAM!')
      e.preventDefault()
      setIsSaving(true)
    }
  }

  return (
    <Background>
      <SnapshotList>
        <SnapshotListTitle>Restore a snapshot</SnapshotListTitle>
        {snapshotListContent()}
        <SnapshotErrorAlert snapshotError={snapshotError} topics={['load']} />
      </SnapshotList>
      <HrBar />
      <FormControl>
        <TextInputLabel>Take a snapshot</TextInputLabel>
        <TextInput
          ref={textInputRef}
          disabled={isSaving}
          placeholder="Snapshot Name"
          value={newSnapshotName}
          onChange={e => setNewSnapshotName(e.target.value)}
          onKeyDown={handleSnapshotSubmission}
        />
        <SnapshotErrorAlert snapshotError={snapshotError} topics={['save']} />
      </FormControl>
    </Background>
  )
}

const SnapshotErrorAlert: React.FC<{
  snapshotError: SnapshotError | undefined
  topics: string[]
}> = ({ snapshotError, topics }) => {
  if (!!snapshotError && topics.includes(snapshotError.topic)) {
    return <ErrorAlert>{snapshotError.message}</ErrorAlert>
  }
  return null
}

export default OpenFinSnapshotList
